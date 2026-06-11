-- ============================================================
-- Allow patients to update their own profile fields
-- (phone, address, allergies). Hospital-set fields (name,
-- age, gender, blood_type, doctor, department) stay read-only
-- by convention — only staff can change those.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE POLICY "Patient updates own profile"
  ON public.patient_profiles FOR UPDATE
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());
