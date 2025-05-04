-- supabase/migrations/0002_update_venues_profiles.sql

-- Create ENUM type for Balkan states
CREATE TYPE balkan_state AS ENUM (
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
    'Slovenia'
);

-- Add new columns to venues table
ALTER TABLE public.venues
ADD COLUMN logo_url TEXT NULL,
ADD COLUMN city TEXT NOT NULL,
ADD COLUMN state balkan_state NOT NULL;

-- Modify existing address column (optional: make nullable if it's just street now)
ALTER TABLE public.venues
ALTER COLUMN address DROP NOT NULL; -- Or keep NOT NULL if it's required street address


-- Add phone number to profiles table
ALTER TABLE public.profiles
ADD COLUMN phone_number TEXT NULL;

-- Update comments if desired
COMMENT ON COLUMN public.venues.address IS 'Street address information for the venue.';
COMMENT ON COLUMN public.venues.city IS 'City where the venue is located.';
COMMENT ON COLUMN public.venues.state IS 'State/Country (within the Balkans) where the venue is located.';
COMMENT ON COLUMN public.venues.logo_url IS 'URL for the venue''s logo image.';
COMMENT ON COLUMN public.profiles.phone_number IS 'Contact phone number for the user (manager/staff).'; 