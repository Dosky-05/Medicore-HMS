-- ============================================================
-- staff_patients table
-- For patients added manually by staff (no portal account).
-- No auth.users FK — these patients may not have a portal login.
-- When a patient later registers on the portal, the portal
-- version (patient_profiles) takes precedence by email match.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_patients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT,
  phone       TEXT,
  age         INTEGER,
  gender      TEXT        DEFAULT 'Male',
  blood_type  TEXT        DEFAULT 'O+',
  department  TEXT,
  status      TEXT        DEFAULT 'Outpatient',
  condition   TEXT,
  allergies   TEXT[]      DEFAULT '{}',
  address     TEXT,
  doctor      TEXT,
  admit_date  DATE        DEFAULT CURRENT_DATE,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.staff_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage staff_patients"
  ON public.staff_patients FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
