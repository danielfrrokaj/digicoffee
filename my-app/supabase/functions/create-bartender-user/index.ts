import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestPayload {
  email: string;
  password: string;
  full_name?: string | null;
  phone_number?: string | null;
  venue_id: string;
  role: 'bartender'; // Fixed role for this function
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { email, password, full_name, phone_number, venue_id, role } = await req.json() as RequestPayload;
    
    // Validation
    if (!email || !password || !venue_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, and venue_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (role !== 'bartender') {
      return new Response(
        JSON.stringify({ error: 'Invalid role: only bartender is allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      // Supabase API URL - env var exported by default when deployed
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE_ROLE KEY - env var exported by default when deployed
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Also create a client using the auth headers from the request
    // This will be used to verify the caller has permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Get the caller's user profile to verify they're a manager of the venue
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Error getting user or user not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the caller's profile information (to check if they're a manager)
    const { data: callerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, venue_id')
      .eq('id', user.id)
      .single();
      
    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'Error getting user profile or profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the caller is a manager of the venue
    if (callerProfile.role !== 'manager' || callerProfile.venue_id !== venue_id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized: must be manager of the specified venue' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create the user
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (createUserError || !newUser.user) {
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'Error creating user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update user's profile
    const { data: profile, error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        venue_id,
        role,
        full_name: full_name || null,
        phone_number: phone_number || null
      })
      .eq('id', newUser.user.id)
      .select()
      .single();
      
    if (updateProfileError) {
      // If we fail to update the profile, we should still return success
      // since the trigger should have created a basic profile
      console.error('Error updating profile:', updateProfileError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: newUser.user.id, email: newUser.user.email },
        profile: profile || {
          id: newUser.user.id,
          venue_id,
          role,
          full_name: full_name || null,
          phone_number: phone_number || null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 