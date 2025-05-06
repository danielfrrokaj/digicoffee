import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestPayload {
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { userId } = await req.json() as RequestPayload;
    
    // Validation
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
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
    
    // Get the caller's user profile
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
    
    // Check if the caller is a manager
    if (callerProfile.role !== 'manager') {
      return new Response(
        JSON.stringify({ error: 'Not authorized: must be a manager' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the target user's profile to check if they're in the same venue as the manager
    const { data: targetProfile, error: targetProfileError } = await supabaseClient
      .from('profiles')
      .select('venue_id, role')
      .eq('id', userId)
      .single();
      
    if (targetProfileError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Error getting target user profile or profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if target is from the same venue and is a bartender
    if (targetProfile.venue_id !== callerProfile.venue_id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized: can only disable staff from your venue' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if target is a bartender (managers can't disable other managers)
    if (targetProfile.role !== 'bartender') {
      return new Response(
        JSON.stringify({ error: 'Not authorized: can only disable bartenders' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Disable the user account
    const { error: disableError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { disabled: true }
    );

    if (disableError) {
      return new Response(
        JSON.stringify({ error: disableError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User account has been disabled',
        userId
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