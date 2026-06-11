-- ============================================================
-- Patient Portal: patient_profiles + portal_appointments
-- Requires: 002_fix_rls_policies.sql (is_admin() function)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  email       TEXT    UNIQUE NOT NULL,
  phone       TEXT,
  age         INTEGER,
  gender      TEXT,
  blood_type  TEXT,
  department  TEXT,
  status      TEXT    DEFAULT 'Outpatient',
  condition   TEXT,
  allergies   TEXT[]  DEFAULT '{}',
  address     TEXT,
  doctor      TEXT,
  admit_date  DATE,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient reads own profile"
  ON public.patient_profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin inserts patient profile"
  ON public.patient_profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin or patient updates profile"
  ON public.patient_profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin deletes patient profile"
  ON public.patient_profiles FOR DELETE
  USING (public.is_admin());

-- ── Portal appointments ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.portal_appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID    NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  patient_name TEXT    NOT NULL,
  doctor       TEXT    NOT NULL,
  doctor_id    TEXT,
  department   TEXT    NOT NULL,
  date         DATE    NOT NULL,
  time         TEXT    NOT NULL,
  type         TEXT    DEFAULT 'Consultation',
  notes        TEXT,
  status       TEXT    DEFAULT 'Scheduled',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portal_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient reads own appointments"
  ON public.portal_appointments FOR SELECT
  USING (auth.uid() = patient_id OR public.is_admin());

CREATE POLICY "Patient books appointment"
  ON public.portal_appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Admin updates appointment"
  ON public.portal_appointments FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admin deletes appointment"
  ON public.portal_appointments FOR DELETE
  USING (public.is_admin());
