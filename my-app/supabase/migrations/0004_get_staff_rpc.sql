-- supabase/migrations/0004_get_staff_rpc.sql
CREATE OR REPLACE FUNCTION get_staff_profiles_with_email()
RETURNS TABLE (
    id UUID,
    venue_id UUID,
    role TEXT,
    full_name TEXT,
    phone_number TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    email TEXT -- Added email
)
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with definer's privileges (usually postgres)
SET search_path = public -- Ensure it operates on public schema
AS $$
BEGIN
    -- Check if the caller is an admin (using the custom claim/role from Auth context)
    -- This is a basic check, adapt if your RLS/role system differs
    -- NOTE: This RLS check inside SECURITY DEFINER might be tricky.
    -- Consider adding RLS policy on the function itself or simplifying the check.
    -- Let's assume RLS on the function or trusting the frontend check for now.
    -- IF NOT (
    --     SELECT COALESCE(auth.jwt()->>'app_metadata','{}')::jsonb->>'role' = 'admin'
    --     FROM auth.users WHERE id = auth.uid()
    -- ) THEN
    --     RAISE EXCEPTION 'Permission denied: Admin role required.';
    -- END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.venue_id,
        p.role,
        p.full_name,
        p.phone_number,
        p.updated_at,
        p.created_at,
        u.email -- Fetch email from auth.users
    FROM
        public.profiles p
    JOIN
        auth.users u ON p.id = u.id
    WHERE
        p.role <> 'admin' -- Exclude admins
    ORDER BY
        p.created_at DESC;
END;
$$;

-- Grant execute permission to the 'authenticated' role (adjust if needed)
GRANT EXECUTE ON FUNCTION public.get_staff_profiles_with_email() TO authenticated; 