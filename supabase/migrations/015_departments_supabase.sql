-- ============================================================
-- Departments table
-- Moves departments to Supabase so the patient portal can
-- always see the latest list regardless of device/browser.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  head       TEXT    DEFAULT '',
  capacity   INTEGER DEFAULT 0,
  current    INTEGER DEFAULT 0,
  color      TEXT    DEFAULT '#00d4ff',
  icon       TEXT    DEFAULT 'Activity',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Any authenticated user (staff + patients) can read departments
CREATE POLICY "Authenticated users read departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- Staff can insert, update, delete
CREATE POLICY "Staff insert departments"
  ON public.departments FOR INSERT
  WITH CHECK (public.is_staff());

CREATE POLICY "Staff update departments"
  ON public.departments FOR UPDATE
  USING (public.is_staff());

CREATE POLICY "Staff delete departments"
  ON public.departments FOR DELETE
  USING (public.is_staff());

-- ── Seed default departments ─────────────────────────────────
INSERT INTO public.departments (name, head, capacity, current, color, icon) VALUES
  ('Cardiology',  'Dr. Emily Chen',     30, 18, '#ff6b6b', 'HeartPulse'),
  ('Neurology',   'Dr. James Wilson',   25, 12, '#ffa94d', 'Brain'),
  ('Orthopedics', 'Dr. Michael Brown',  20, 15, '#69db7c', 'Bone'),
  ('Pediatrics',  'Dr. Sarah Davis',    35, 22, '#74c0fc', 'Baby'),
  ('Emergency',   'Dr. Robert Lee',     40, 31, '#f783ac', 'Ambulance'),
  ('Radiology',   'Dr. Linda Martinez', 15,  8, '#a9e34b', 'Microscope')
ON CONFLICT (name) DO NOTHING;
