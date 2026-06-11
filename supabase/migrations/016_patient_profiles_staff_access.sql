-- ============================================================
-- Allow all staff (not just admin) to read and manage patient
-- profiles so portal-registered patients appear in the staff
-- Patients page and staff can update clinical details.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Fix SELECT: all staff can read any patient profile
DROP POLICY IF EXISTS "Patient reads own profile" ON public.patient_profiles;
CREATE POLICY "Staff or patient reads profile"
  ON public.patient_profiles FOR SELECT
  USING (id = auth.uid() OR public.is_staff());

-- Fix INSERT: any staff member can add a patient profile
DROP POLICY IF EXISTS "Admin inserts patient profile" ON public.patient_profiles;
CREATE POLICY "Staff inserts patient profile"
  ON public.patient_profiles FOR INSERT
  WITH CHECK (public.is_staff());

-- Fix UPDATE: all staff can update clinical details
DROP POLICY IF EXISTS "Admin or patient updates profile" ON public.patient_profiles;
CREATE POLICY "Staff or patient updates profile"
  ON public.patient_profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_staff());

-- Fix DELETE: all staff can soft-delete / remove a patient profile
DROP POLICY IF EXISTS "Admin deletes patient profile" ON public.patient_profiles;
CREATE POLICY "Staff deletes patient profile"
  ON public.patient_profiles FOR DELETE
  USING (public.is_staff());
