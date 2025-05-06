import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'; // Use appropriate version
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have shared CORS headers

interface StaffDetails {
  email: string;
  password: string;
  role: 'manager' | 'bartender';
  venueId: string;
  fullName?: string;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: StaffDetails = await req.json();

    // --- Validation ---
    if (!payload.email || !payload.password || !payload.role || !payload.venueId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields (email, password, role, venueId).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (payload.role !== 'manager' && payload.role !== 'bartender') {
       return new Response(JSON.stringify({ success: false, message: 'Invalid role specified.' }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }


    // --- Initialize Admin Client ---
    // Get Supabase URL and Service Role Key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceKey, {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       }
     });


    // --- Create User in Auth ---
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true, // Mark email as confirmed immediately
      user_metadata: { 
          full_name: payload.fullName,
      },
    });

    if (authError || !authData?.user) {
      console.error('Error creating auth user:', authError?.message);
      return new Response(JSON.stringify({ success: false, message: `Auth Error: ${authError?.message || 'Failed to create user.'}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;
    console.log(`Auth user created: ${userId}`);


    // --- Update the Profile created by the Trigger ---
    // Instead of insert, we now update the existing row
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        // id is used in eq filter, not needed in update payload
        role: payload.role,
        venue_id: payload.venueId,
        full_name: payload.fullName, // Update full name here as well
        phone_number: payload.phone,
        updated_at: new Date().toISOString(), // Explicitly set updated_at
      })
      .eq('id', userId); // Specify which profile to update

    if (profileError) {
       console.error(`Error updating profile for ${userId}:`, profileError.message);
       // Attempt to clean up - delete the auth user if profile update failed
       await supabaseAdmin.auth.admin.deleteUser(userId);
       console.log(`Cleaned up auth user ${userId} due to profile update error.`);
       return new Response(JSON.stringify({ success: false, message: `Profile Update Error: ${profileError.message}` }), {
         status: 500, // Internal server error likely
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

     console.log(`Profile updated for ${userId}`);


    // --- Success ---
    return new Response(JSON.stringify({ success: true, message: 'Staff user created successfully.', userId: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Generic error in function:', error.message);
    return new Response(JSON.stringify({ success: false, message: `Internal Server Error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 