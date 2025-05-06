import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

const fetchVenueById = async (venueId: string): Promise<Venue | null> => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single();

  if (error) {
    console.error('Error fetching venue:', error);
    throw new Error(error.message);
  }
  
  return data;
};

export const useVenueById = (venueId: string | undefined) => {
  return useQuery<Venue | null, Error>({
    queryKey: ['venue', venueId],
    queryFn: () => fetchVenueById(venueId as string),
    enabled: !!venueId, // Only run if venueId exists
  });
}; 