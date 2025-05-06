import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { AuthResponse, UserIdentity, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

// Type for Profile data from our DB - Ensure this is exported
export interface Profile {
  id: string; // Corresponds to auth.users.id
  venue_id: string | null;
  role: 'admin' | 'manager' | 'bartender';
  full_name: string | null;
  phone_number: string | null;
  updated_at: string;
  created_at: string;
  email?: string;
}

// Type for the data needed to sign up a new staff member
export type NewStaffCredentials = SignUpWithPasswordCredentials;

// --- Fetch Staff Profiles --- 
// Calls the RPC function to securely get profiles with emails
const fetchStaffProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase.rpc('get_staff_profiles_with_email');

  if (error) {
    console.error('Error fetching staff profiles via RPC:', error);
    throw new Error(error.message);
  }

  // Add type checking and filtering for the role
  if (!Array.isArray(data)) {
      console.error("RPC did not return an array:", data);
      return []; // Return empty array if data is not as expected
  }

  // Filter the data to ensure role is one of the expected values
  // and perform a safer type assertion within the filter.
  const validStaffProfiles = data.filter(
      (item: any): item is Profile => 
          item && 
          typeof item.id === 'string' && 
          (item.role === 'manager' || item.role === 'bartender') // We excluded 'admin' in the RPC itself
          // Add other checks if necessary
  );

  return validStaffProfiles || []; 
};

export const useFetchStaff = () => {
  return useQuery<Profile[], Error>({
    queryKey: ['staffProfiles'],
    queryFn: fetchStaffProfiles,
  });
};

// --- Sign Up Staff Member (via standard auth - DEPRECATED if using Edge Function) --- 
const signUpStaff = async (credentials: NewStaffCredentials): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    console.error('Error signing up staff:', error);
    throw new Error(error.message);
  }
  
  // Sign up successful, user needs to confirm email.
  // Profile row created by trigger with default role.
  // Admin needs to manually update role/venue_id in DB.
  if (!data.user) {
      // Should not happen if error is null, but good practice to check
      throw new Error("Sign up succeeded but no user data returned.");
  }
  return { data, error: null }; // Return the full AuthResponse object
};

// Deprecated hook if using Edge Function
export const useSignUpStaff = () => {
  const queryClient = useQueryClient();

  // Update mutation type signature to expect AuthResponse
  return useMutation<AuthResponse, Error, NewStaffCredentials>({
    mutationFn: signUpStaff,
    onSuccess: (response) => { // Response is AuthResponse
      // Invalidate staff list to potentially show the new profile 
      queryClient.invalidateQueries({ queryKey: ['staffProfiles'] });
      console.log(`DEPRECATED: Staff sign-up initiated for ${response.data.user?.email}. Waiting for confirmation and manual admin update.`);
    },
    onError: (error) => {
      console.error("DEPRECATED: Staff sign-up mutation error:", error.message);
    }
  });
};

// --- Create Staff Member via Edge Function --- 
// Interface for the data sent TO the Edge Function
export interface CreateStaffPayload {
    email: string;
    password: string;
    role: 'manager' | 'bartender';
    venueId: string;
    fullName?: string;
    phone?: string;
}

const createStaffViaFunction = async (payload: CreateStaffPayload): Promise<{ success: boolean; message: string; userId?: string }> => {
    const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: payload,
    });

    if (error) {
        console.error('Error invoking create-staff-user function:', error);
        throw new Error(error.message);
    }

    // Assuming the function returns { success: boolean, message: string, userId?: string }
    return data;
};

export const useCreateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean; message: string; userId?: string }, Error, CreateStaffPayload>({
        mutationFn: createStaffViaFunction,
        onSuccess: (data) => {
            if (data.success) {
                console.log('Staff created successfully via Edge Function:', data.message);
                queryClient.invalidateQueries({ queryKey: ['staffProfiles'] });
            } else {
                // Handle specific errors returned from the function if needed
                console.error('Edge function reported failure:', data.message);
                // Throw an error to be caught by onError in the component
                throw new Error(data.message || 'Failed to create staff via function.');
            }
        },
        onError: (error) => {
            // Handles network errors or errors thrown from onSuccess
            console.error("Create staff mutation error (hook level):", error.message);
        }
    });
};

// --- Delete Staff Member via Edge Function --- 
interface DeleteStaffPayload {
    userId: string;
}

const deleteStaffViaFunction = async (payload: DeleteStaffPayload): Promise<{ success: boolean; message: string }> => {
    const { data, error } = await supabase.functions.invoke('delete-staff-user', {
        body: payload,
    });

    if (error) {
        console.error('Error invoking delete-staff-user function:', error);
        throw new Error(error.message);
    }
    return data;
};

export const useDeleteStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean; message: string }, Error, DeleteStaffPayload>({
        mutationFn: deleteStaffViaFunction,
        onSuccess: (data, variables) => {
            if (data.success) {
                console.log(`Staff ${variables.userId} deleted successfully via Edge Function:`, data.message);
                queryClient.invalidateQueries({ queryKey: ['staffProfiles'] });
            } else {
                console.error('Edge function reported delete failure:', data.message);
                throw new Error(data.message || 'Failed to delete staff via function.');
            }
        },
        onError: (error) => {
            console.error("Delete staff mutation error (hook level):", error.message);
        }
    });
};
