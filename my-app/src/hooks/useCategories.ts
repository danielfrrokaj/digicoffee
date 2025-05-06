import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Define category type based on database schema
export interface Category {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

// Type for category data used in creation
export type CreateCategoryData = Omit<Category, 'id' | 'created_at'>;

// Type for category update
export interface UpdateCategoryPayload {
  id: string;
  data: Partial<Omit<Category, 'id' | 'created_at' | 'venue_id'>>;
}

// --- Fetch Categories for a Venue ---
const fetchCategoriesByVenue = async (venueId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('venue_id', venueId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message);
  }
  
  return data || [];
};

export const useFetchCategories = (venueId: string | undefined) => {
  return useQuery<Category[], Error>({
    queryKey: ['categories', venueId],
    queryFn: () => fetchCategoriesByVenue(venueId as string),
    enabled: !!venueId, // Only run the query if venueId is provided
  });
};

// --- Create Category ---
const createCategory = async (newCategory: CreateCategoryData): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(newCategory)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw new Error(error.message);
  }
  
  return data;
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, CreateCategoryData>({
    mutationFn: createCategory,
    onSuccess: (data) => {
      // Invalidate categories query to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['categories', data.venue_id] });
    },
    onError: (error) => {
      console.error('Create category mutation error:', error.message);
    }
  });
};

// --- Update Category ---
const updateCategory = async ({ id, data }: UpdateCategoryPayload): Promise<Category> => {
  const { data: updatedCategory, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw new Error(error.message);
  }
  
  return updatedCategory;
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, UpdateCategoryPayload>({
    mutationFn: updateCategory,
    onSuccess: (data) => {
      // Invalidate categories query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['categories', data.venue_id] });
    },
    onError: (error) => {
      console.error('Update category mutation error:', error.message);
    }
  });
};

// --- Delete Category ---
const deleteCategory = async (id: string): Promise<{ id: string, venueId: string }> => {
  // First get the category to save venueId for cache invalidation
  const { data: category, error: fetchError } = await supabase
    .from('categories')
    .select('venue_id')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    console.error('Error fetching category before delete:', fetchError);
    throw new Error(fetchError.message);
  }
  
  const venueId = category.venue_id;
  
  // Then delete the category
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting category:', deleteError);
    throw new Error(deleteError.message);
  }
  
  return { id, venueId };
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string, venueId: string }, Error, string>({
    mutationFn: deleteCategory,
    onSuccess: ({ venueId }) => {
      // Invalidate categories query to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: ['categories', venueId] });
      // Also invalidate products as they may be related to the deleted category
      queryClient.invalidateQueries({ queryKey: ['products', venueId] });
    },
    onError: (error) => {
      console.error('Delete category mutation error:', error.message);
    }
  });
}; 