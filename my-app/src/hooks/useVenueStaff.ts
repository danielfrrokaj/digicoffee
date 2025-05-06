import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Define staff profile type
export interface StaffProfile {
  id: string;
  venue_id: string | null;
  role: 'manager' | 'bartender';
  full_name: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  email?: string; // May come from auth.users
}

// Type for creating a new staff member
export interface CreateStaffPayload {
  email: string;
  password: string;
  full_name?: string;
  phone_number?: string;
  venue_id: string;
}

// --- Fetch Staff for a specific venue ---
const fetchStaffByVenue = async (venueId: string): Promise<StaffProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('venue_id', venueId)
    .eq('role', 'bartender')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching venue staff:', error);
    throw new Error(error.message);
  }
  
  return data || [];
};

export const useFetchVenueStaff = (venueId: string | undefined) => {
  return useQuery<StaffProfile[], Error>({
    queryKey: ['venue-staff', venueId],
    queryFn: () => fetchStaffByVenue(venueId as string),
    enabled: !!venueId, // Only run if venueId exists
  });
};

// --- Create Bartender Staff (as Manager) ---
// This would typically call an edge function with service_role key
const createBartender = async (payload: CreateStaffPayload): Promise<StaffProfile> => {
  // For now, we'll use a simplified implementation that would
  // need to be replaced with a proper edge function call
  
  // Call edge function - this is a placeholder
  const { data, error } = await supabase.functions.invoke('create-bartender-user', {
    body: {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name || null,
      phone_number: payload.phone_number || null,
      venue_id: payload.venue_id,
      role: 'bartender' // Fixed role for this function
    }
  });

  if (error) {
    console.error('Error creating bartender:', error);
    throw new Error(error.message || 'Failed to create bartender');
  }
  
  return data.profile;
};

export const useCreateBartender = () => {
  const queryClient = useQueryClient();

  return useMutation<StaffProfile, Error, CreateStaffPayload>({
    mutationFn: createBartender,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venue-staff', data.venue_id] });
    },
    onError: (error) => {
      console.error('Create bartender mutation error:', error.message);
    }
  });
};

// --- Disable Staff Account ---
// This would call an edge function to disable the user's auth account
const disableStaffAccount = async (userId: string, venueId: string): Promise<{ id: string }> => {
  // Call edge function - this is a placeholder
  const { data, error } = await supabase.functions.invoke('disable-staff-user', {
    body: { userId }
  });

  if (error) {
    console.error('Error disabling staff:', error);
    throw new Error(error.message || 'Failed to disable staff account');
  }
  
  return { id: userId };
};

export const useDisableStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, { userId: string, venueId: string }>({
    mutationFn: ({ userId, venueId }) => disableStaffAccount(userId, venueId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venue-staff', variables.venueId] });
    },
    onError: (error) => {
      console.error('Disable staff mutation error:', error.message);
    }
  });
};

// --- Reset Staff Password ---
// This would call an edge function to reset the user's password
const resetStaffPassword = async (
  userId: string, 
  venueId: string,
  newPassword: string
): Promise<{ id: string }> => {
  // Call edge function - this is a placeholder
  const { data, error } = await supabase.functions.invoke('reset-staff-password', {
    body: { userId, newPassword }
  });

  if (error) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
  
  return { id: userId };
};

export const useResetStaffPassword = () => {
  return useMutation<
    { id: string }, 
    Error, 
    { userId: string, venueId: string, newPassword: string }
  >({
    mutationFn: ({ userId, venueId, newPassword }) => 
      resetStaffPassword(userId, venueId, newPassword),
    onError: (error) => {
      console.error('Reset password mutation error:', error.message);
    }
  });
}; 