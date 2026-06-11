-- ============================================================
-- Medical records table (Supabase-side)
-- Staff write records here; portal patients read their own.
-- The staff page ALSO keeps its localStorage copy for the
-- staff view — this table is the patient-visible mirror.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.medical_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID,           -- portal patient auth UUID (NULL if no portal account)
  patient_name TEXT NOT NULL,
  doctor       TEXT NOT NULL,
  date         DATE NOT NULL,
  diagnosis    TEXT,
  prescription TEXT,
  notes        TEXT,
  lab_results  TEXT,
  vitals       JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Staff can create and read all records
CREATE POLICY "Staff manage medical records"
  ON public.medical_records FOR ALL
  USING  (public.is_staff())
  WITH CHECK (public.is_staff());

-- Patients can read only their own records
CREATE POLICY "Patient reads own records"
  ON public.medical_records FOR SELECT
  USING (patient_id IS NOT NULL AND patient_id = auth.uid());
