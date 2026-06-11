-- ============================================================
-- Allow all active staff (not just admins) to read and update
-- portal_appointments so receptionist/nurses can manage bookings.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Helper: returns true for any active staff member (any role)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE id = auth.uid()
      AND is_active = true
  );
$$;

-- Drop the old admin-only SELECT / UPDATE policies
DROP POLICY IF EXISTS "Patient reads own appointments"  ON public.portal_appointments;
DROP POLICY IF EXISTS "Admin updates appointment"       ON public.portal_appointments;
DROP POLICY IF EXISTS "Admin deletes appointment"       ON public.portal_appointments;

-- Patients see their own; all staff see everything
CREATE POLICY "Patients and staff read appointments"
  ON public.portal_appointments FOR SELECT
  USING (auth.uid() = patient_id OR public.is_staff());

-- Any active staff can update status / notes
CREATE POLICY "Staff updates appointment"
  ON public.portal_appointments FOR UPDATE
  USING (public.is_staff());

-- Only admins can hard-delete
CREATE POLICY "Admin deletes appointment"
  ON public.portal_appointments FOR DELETE
  USING (public.is_admin());
