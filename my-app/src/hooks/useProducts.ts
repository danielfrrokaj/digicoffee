import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// Define product type based on database schema
export interface Product {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null; // Legacy category name field
  category_id: string | null; // New reference to categories table
  image_url: string | null; // External URL (legacy)
  storage_path: string | null; // Supabase Storage path
  is_available: boolean;
  created_at: string;
}

// Type for product data used in creation (omit generated fields)
export type CreateProductData = Omit<Product, 'id' | 'created_at'>;

// Type for product update - requires ID and partial data
export interface UpdateProductPayload {
  id: string;
  data: Partial<Omit<Product, 'id' | 'created_at' | 'venue_id'>>;
}

// --- Fetch Products for a Venue ---
const fetchProductsByVenue = async (venueId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('venue_id', venueId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error(error.message);
  }
  
  return data || [];
};

// --- Fetch Products by Category ---
export const fetchProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products by category:', error);
    throw new Error(error.message);
  }
  
  return data || [];
};

export const useFetchProducts = (venueId: string | undefined) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', venueId],
    queryFn: () => fetchProductsByVenue(venueId as string),
    enabled: !!venueId, // Only run the query if venueId is provided
  });
};

export const useFetchProductsByCategory = (categoryId: string | undefined) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', 'by-category', categoryId],
    queryFn: () => fetchProductsByCategory(categoryId as string),
    enabled: !!categoryId, // Only run the query if categoryId is provided
  });
};

// --- Upload Product Image ---
export const uploadProductImage = async (file: File, venueName: string, productName: string): Promise<string> => {
  // Sanitize file name to avoid spaces and special characters
  const timestamp = new Date().getTime();
  const sanitizedVenueName = venueName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const sanitizedProductName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `${sanitizedVenueName}/${sanitizedProductName}-${timestamp}${file.name.substring(file.name.lastIndexOf('.'))}`;
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error(error.message);
  }
  
  return data.path;
};

// --- Get Public URL for Product Image ---
export const getProductImageUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// --- Create Product ---
const createProduct = async (newProduct: CreateProductData): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert(newProduct)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw new Error(error.message);
  }
  
  return data;
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductData>({
    mutationFn: createProduct,
    onSuccess: (data) => {
      // Invalidate products query to refetch with new data
      queryClient.invalidateQueries({ queryKey: ['products', data.venue_id] });
      if (data.category_id) {
        queryClient.invalidateQueries({ queryKey: ['products', 'by-category', data.category_id] });
      }
    },
    onError: (error) => {
      console.error('Create product mutation error:', error.message);
    }
  });
};

// --- Update Product ---
const updateProduct = async ({ id, data }: UpdateProductPayload): Promise<Product> => {
  const { data: updatedProduct, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(error.message);
  }
  
  return updatedProduct;
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, UpdateProductPayload>({
    mutationFn: updateProduct,
    onSuccess: (data) => {
      // Invalidate products query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['products', data.venue_id] });
      if (data.category_id) {
        queryClient.invalidateQueries({ queryKey: ['products', 'by-category', data.category_id] });
      }
    },
    onError: (error) => {
      console.error('Update product mutation error:', error.message);
    }
  });
};

// --- Delete Product ---
const deleteProduct = async (id: string): Promise<{ id: string, venueId: string, categoryId: string | null }> => {
  // First get the product to save venueId for cache invalidation
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('venue_id, category_id, storage_path')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    console.error('Error fetching product before delete:', fetchError);
    throw new Error(fetchError.message);
  }
  
  const venueId = product.venue_id;
  const categoryId = product.category_id;
  const storagePath = product.storage_path;
  
  // Delete the product image if it exists
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove([storagePath]);
      
    if (storageError) {
      console.error('Error deleting product image:', storageError);
      // Continue with product deletion even if image deletion fails
    }
  }
  
  // Then delete the product
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting product:', deleteError);
    throw new Error(deleteError.message);
  }
  
  return { id, venueId, categoryId };
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string, venueId: string, categoryId: string | null }, Error, string>({
    mutationFn: deleteProduct,
    onSuccess: ({ venueId, categoryId }) => {
      // Invalidate products query to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: ['products', venueId] });
      if (categoryId) {
        queryClient.invalidateQueries({ queryKey: ['products', 'by-category', categoryId] });
      }
    },
    onError: (error) => {
      console.error('Delete product mutation error:', error.message);
    }
  });
}; 