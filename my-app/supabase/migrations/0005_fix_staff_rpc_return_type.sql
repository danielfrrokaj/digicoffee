-- supabase/migrations/0005_fix_staff_rpc_return_type.sql

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_staff_profiles_with_email();

-- Recreate the function with the correct email type in RETURNS TABLE
CREATE FUNCTION get_staff_profiles_with_email() -- Use CREATE FUNCTION, not CREATE OR REPLACE
RETURNS TABLE (
    id UUID,
    venue_id UUID,
    role TEXT,
    full_name TEXT,
    phone_number TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    email character varying -- Changed from TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.venue_id,
        p.role,
        p.full_name,
        p.phone_number,
        p.updated_at,
        p.created_at,
        u.email -- This is actually character varying
    FROM
        public.profiles p
    JOIN
        auth.users u ON p.id = u.id
    WHERE
        p.role <> 'admin'
    ORDER BY
        p.created_at DESC;
END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION public.get_staff_profiles_with_email() TO authenticated; 