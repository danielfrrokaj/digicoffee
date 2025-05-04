import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient'; // Adjust path if necessary

// Define the ENUM type for states
export type BalkanState = 
  | 'Albania'
  | 'Bosnia and Herzegovina'
  | 'Bulgaria'
  | 'Croatia'
  | 'Greece'
  | 'Kosovo'
  | 'Montenegro'
  | 'North Macedonia'
  | 'Romania'
  | 'Serbia'
  | 'Slovenia';

export const balkanStates: BalkanState[] = [
  'Albania',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Croatia',
  'Greece',
  'Kosovo',
  'Montenegro',
  'North Macedonia',
  'Romania',
  'Serbia',
  'Slovenia',
];

// Updated Venue type to include manager_id
export interface Venue {
  id: string;
  name: string;
  address: string | null; // Street address
  city: string;
  state: BalkanState;
  logo_url: string | null;
  manager_id: string | null; // Added manager_id
  created_at: string;
}

// Type for venue data used in creation/update (omit generated fields)
type UpsertVenueData = Omit<Venue, 'id' | 'created_at'>;
// Type for just the updatable fields + ID
export type UpdateVenuePayload = Partial<Omit<Venue, 'created_at'>> & { id: string };

// --- Fetch Venues --- 
const fetchVenues = async (): Promise<Venue[]> => {
  // Fetch venues and potentially the manager's name if needed later
  // For now, just fetch venue fields including manager_id
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching venues:', error);
    throw new Error(error.message);
  }
  return data || [];
};

export const useFetchVenues = () => {
  return useQuery<Venue[], Error>({
    queryKey: ['venues'],
    queryFn: fetchVenues,
  });
};

// --- Create Venue --- 
const createVenue = async (newVenue: UpsertVenueData): Promise<Venue | null> => {
  const { data, error } = await supabase
    .from('venues')
    .insert(newVenue)
    .select()
    .single();

  if (error) {
    console.error('Error creating venue:', error);
    throw new Error(error.message);
  }
  return data;
};

export const useCreateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation<Venue | null, Error, UpsertVenueData>({
    mutationFn: createVenue,
    onSuccess: (data) => {
      // Invalidate cache to refetch list
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      // Can also update the cache directly if needed
      // queryClient.setQueryData(['venues', data?.id], data);
    },
    onError: (error) => {
      console.error("Create venue mutation error:", error.message);
    }
  });
};

// --- Update Venue --- 
const updateVenue = async (venueData: UpdateVenuePayload): Promise<Venue | null> => {
  const { id, ...updateData } = venueData;
  const { data, error } = await supabase
    .from('venues')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating venue:', error);
    throw new Error(error.message);
  }
  return data;
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation<Venue | null, Error, UpdateVenuePayload>({
    mutationFn: updateVenue,
    onSuccess: (data) => {
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      // Optionally update the specific venue query cache if you have one
      if (data) {
        queryClient.setQueryData(['venues', data.id], data); // Example if you had individual venue queries
      }
    },
    onError: (error) => {
      console.error("Update venue mutation error:", error.message);
    }
  });
};

// --- Assign Manager (Placeholder - separate mutation) ---
// We'll add this later, maybe in a useStaff hook 