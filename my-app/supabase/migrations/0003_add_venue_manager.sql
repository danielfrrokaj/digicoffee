-- supabase/migrations/0003_add_venue_manager.sql

ALTER TABLE public.venues
ADD COLUMN manager_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL;
-- Using public.profiles(id) as FK target assuming manager must have a profile.
-- ON DELETE SET NULL: If the manager's profile is deleted, the venue's manager_id becomes NULL.

COMMENT ON COLUMN public.venues.manager_id IS 'The user ID (from profiles/auth.users) of the manager assigned to this venue.';

-- Optional: Add an index for potentially looking up venues by manager
CREATE INDEX IF NOT EXISTS idx_venues_manager_id ON public.venues(manager_id); 