-- ============================================================
-- Rooms & Wards table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rooms (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  number      TEXT    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'General Ward',
  department  TEXT    NOT NULL,
  floor       INTEGER NOT NULL DEFAULT 1,
  beds        INTEGER NOT NULL DEFAULT 1,
  status      TEXT    NOT NULL DEFAULT 'Available'
              CHECK (status IN ('Available','Occupied','Critical','Reserved','Maintenance')),
  patient     TEXT,
  patient_id  UUID,
  admit_date  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage rooms"
  ON public.rooms FOR ALL
  USING  (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── Seed default rooms ───────────────────────────────────────
INSERT INTO public.rooms (number, type, department, floor, beds, status, patient, admit_date, notes) VALUES
  ('101', 'General Ward', 'Cardiology',  1, 4, 'Occupied',    'John Smith',      '2026-05-10', 'Hypertension monitoring'),
  ('102', 'Private',      'Cardiology',  1, 1, 'Occupied',    'William Brown',   '2026-05-08', 'Cardiac monitoring required'),
  ('103', 'Private',      'Cardiology',  1, 1, 'Occupied',    'Barbara Harris',  '2026-05-05', 'Heart failure - close observation'),
  ('104', 'General Ward', 'Cardiology',  1, 4, 'Available',   NULL,              NULL,         NULL),
  ('201', 'General Ward', 'Neurology',   2, 3, 'Occupied',    'Robert Davis',    '2026-05-12', 'Chronic migraine observation'),
  ('202', 'Private',      'Neurology',   2, 1, 'Available',   NULL,              NULL,         NULL),
  ('203', 'General Ward', 'Neurology',   2, 3, 'Maintenance', NULL,              NULL,         'Electrical repairs in progress'),
  ('301', 'ICU',          'Emergency',   3, 1, 'Critical',    'Patricia Miller', '2026-05-20', 'Multiple trauma - critical care'),
  ('302', 'ICU',          'Emergency',   3, 1, 'Available',   NULL,              NULL,         NULL),
  ('303', 'Emergency',    'Emergency',   3, 2, 'Available',   NULL,              NULL,         NULL),
  ('401', 'Pediatric',    'Pediatrics',  4, 4, 'Available',   NULL,              NULL,         NULL),
  ('402', 'Private',      'Pediatrics',  4, 1, 'Reserved',    NULL,              NULL,         'Reserved for incoming admission'),
  ('501', 'General Ward', 'Orthopedics', 5, 4, 'Available',   NULL,              NULL,         NULL),
  ('502', 'Isolation',    'General',     5, 1, 'Maintenance', NULL,              NULL,         'Sanitization scheduled')
ON CONFLICT DO NOTHING;
