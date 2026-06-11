-- ============================================================
-- Fix RLS policies to check the database instead of JWT metadata.
-- JWT metadata can be stale between token refreshes, causing
-- admin inserts/reads to fail unexpectedly.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Helper function that checks if the current user is an active admin.
-- SECURITY DEFINER runs with the table owner's privileges so it can
-- read staff_profiles without triggering RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- Drop old JWT-based policies
DROP POLICY IF EXISTS "Admin reads all profiles"  ON public.staff_profiles;
DROP POLICY IF EXISTS "Admin inserts profiles"    ON public.staff_profiles;
DROP POLICY IF EXISTS "Admin updates profiles"    ON public.staff_profiles;
DROP POLICY IF EXISTS "Admin deletes profiles"    ON public.staff_profiles;

-- Read: own profile always, all profiles if admin
CREATE POLICY "Read profiles"
  ON public.staff_profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Insert: only admins
CREATE POLICY "Admin inserts profiles"
  ON public.staff_profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- Update: only admins
CREATE POLICY "Admin updates profiles"
  ON public.staff_profiles FOR UPDATE
  USING (public.is_admin());

-- Delete: only admins
CREATE POLICY "Admin deletes profiles"
  ON public.staff_profiles FOR DELETE
  USING (public.is_admin());
