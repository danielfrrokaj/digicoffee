import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// This type should match the profile structure from the database
export interface Profile {
  id: string; 
  venue_id: string | null;
  role: 'admin' | 'manager' | 'bartender';
  full_name: string | null;
  phone_number: string | null;
  updated_at: string;
  created_at: string;
  email?: string; // Email might come from auth.users or get_staff_profiles_with_email RPC
}

// Custom hook to fetch a profile by ID
const fetchProfileById = async (userId: string): Promise<Profile> => {
  // First try to fetch from the RPC to get profile with email
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_staff_profiles_with_email');
  
  if (!rpcError && Array.isArray(rpcData)) {
    // Find the profile in the RPC results
    const profileFromRpc = rpcData.find(
      (profile: any) => profile.id === userId
    );
    
    if (profileFromRpc) return profileFromRpc as Profile;
  }
  
  // Fallback to direct query if RPC fails or profile not found
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile by ID:', error.message);
    throw new Error(error.message);
  }

  return data as Profile;
};

export const useProfileById = (userId: string | undefined) => {
  return useQuery<Profile, Error>({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfileById(userId as string),
    // Skip query if no userId is provided
    enabled: !!userId,
  });
}; 