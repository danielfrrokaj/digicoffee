import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

interface AssignPayload {
  venueId: string;
  managerUserId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { venueId, managerUserId }: AssignPayload = await req.json();

    if (!venueId || !managerUserId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing venueId or managerUserId.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Initialize Admin Client ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Server config error.');

    const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // --- Validation (Optional but Recommended) ---
    // 1. Check if managerUserId exists in profiles (implies they exist in auth.users too)
    const { data: managerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, venue_id')
      .eq('id', managerUserId)
      .maybeSingle(); // Use maybeSingle to handle null case gracefully

    if (profileError || !managerProfile) {
       console.error(`Error fetching or finding profile for ${managerUserId}:`, profileError?.message);
       return new Response(JSON.stringify({ success: false, message: `Manager user profile not found (ID: ${managerUserId}).` }), {
         status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }
     // 2. Check if venueId exists (less critical if FK constraints are solid, but good practice)
     // const { data: venueData, error: venueError } = await supabaseAdmin.from('venues').select('id').eq('id', venueId).maybeSingle();
     // if (venueError || !venueData) { ... handle venue not found ... }


    // --- Update Profile ---
    // Ensure the user has the 'manager' role and assign the venue
    const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: 'manager', // Ensure role is manager
            venue_id: venueId,
            updated_at: new Date().toISOString(),
         })
        .eq('id', managerUserId);

     if (updateProfileError) {
       console.error(`Error updating profile for manager ${managerUserId}:`, updateProfileError.message);
       return new Response(JSON.stringify({ success: false, message: `Failed to update manager profile: ${updateProfileError.message}` }), {
         status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
     console.log(`Profile updated for manager ${managerUserId}`);


    // --- Update Venue ---
    // Set the manager_id on the venue
     const { error: updateVenueError } = await supabaseAdmin
       .from('venues')
       .update({ manager_id: managerUserId })
       .eq('id', venueId);

     if (updateVenueError) {
       console.error(`Error updating venue ${venueId}:`, updateVenueError.message);
        // Optional: Attempt to revert profile change if venue update fails? (complex)
       return new Response(JSON.stringify({ success: false, message: `Failed to update venue assignment: ${updateVenueError.message}` }), {
         status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
      console.log(`Venue ${venueId} updated with manager ${managerUserId}`);


    // --- Success ---
    return new Response(JSON.stringify({ success: true, message: 'Manager assigned successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Generic error in assign manager function:', error.message);
    return new Response(JSON.stringify({ success: false, message: `Internal Server Error: ${error.message}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 