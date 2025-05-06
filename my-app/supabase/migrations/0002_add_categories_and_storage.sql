-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE categories IS 'Product categories for organizing menu items.';
CREATE INDEX idx_categories_venue_id ON categories(venue_id);

-- Add foreign key to products table
ALTER TABLE products 
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
COMMENT ON COLUMN products.category_id IS 'Reference to the category this product belongs to';
CREATE INDEX idx_products_category_id ON products(category_id);

-- Create storage buckets for product images
INSERT INTO storage.buckets (id, name, public) VALUES 
('product-images', 'product-images', true);

-- Set up storage policy to allow access to product images
CREATE POLICY "Public Access to Product Images" 
ON storage.objects FOR SELECT USING (
    bucket_id = 'product-images'
);

-- Set up storage policy to allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT TO authenticated USING (
    bucket_id = 'product-images'
);

-- Add storage_path column to products table for referencing uploaded images
ALTER TABLE products 
ADD COLUMN storage_path TEXT;
COMMENT ON COLUMN products.storage_path IS 'Path to the product image in the storage bucket'; 