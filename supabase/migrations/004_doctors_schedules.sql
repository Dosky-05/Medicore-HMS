-- ============================================================
-- Doctors & Schedules for cross-device patient portal booking
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doctors (
  id             BIGINT PRIMARY KEY,
  name           TEXT NOT NULL,
  specialization TEXT,
  department     TEXT,
  phone          TEXT,
  email          TEXT,
  experience     INTEGER DEFAULT 0,
  status         TEXT DEFAULT 'Active',
  schedule_label TEXT,
  avatar         TEXT,
  image          TEXT,
  patients_count INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read doctors"
  ON public.doctors FOR SELECT USING (true);

CREATE POLICY "Admin write doctors"
  ON public.doctors FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Doctor Schedules ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id                   BIGINT PRIMARY KEY,
  doctor_id            BIGINT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  doctor_name          TEXT,
  work_days            TEXT[] DEFAULT '{}',
  start_time           TEXT DEFAULT '08:00 AM',
  end_time             TEXT DEFAULT '05:00 PM',
  max_patients_per_day INTEGER DEFAULT 8,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read schedules"
  ON public.doctor_schedules FOR SELECT USING (true);

CREATE POLICY "Admin write schedules"
  ON public.doctor_schedules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Seed mock doctors ─────────────────────────────────────────

INSERT INTO public.doctors (id, name, specialization, department, phone, email, experience, status, schedule_label, avatar, image, patients_count) VALUES
(1, 'Dr. Emily Chen',    'Cardiologist',         'Cardiology',   '+1-555-0101', 'e.chen@medicore.com',      12, 'Active', 'Mon-Tue-Wed-Thu-Fri',         'EC', 'https://i.pravatar.cc/150?u=1', 45),
(2, 'Dr. James Wilson',  'Neurologist',           'Neurology',    '+1-555-0102', 'j.wilson@medicore.com',    15, 'Active', 'Mon-Tue-Wed-Thu',             'JW', 'https://i.pravatar.cc/150?u=2', 38),
(3, 'Dr. Michael Brown', 'Orthopedic Surgeon',    'Orthopedics',  '+1-555-0103', 'm.brown@medicore.com',     10, 'Active', 'Tue-Wed-Thu-Fri-Sat',         'MB', 'https://i.pravatar.cc/150?u=3', 52),
(4, 'Dr. Sarah Davis',   'Pediatrician',          'Pediatrics',   '+1-555-0104', 's.davis@medicore.com',      8, 'Active', 'Mon-Tue-Wed-Thu-Fri',         'SD', NULL,                           61),
(5, 'Dr. Robert Zane',   'Emergency Physician',   'Emergency',    '+1-555-0105', 'r.zane@medicore.com',      20, 'Active', 'Mon-Tue-Wed-Thu-Fri-Sat-Sun', 'RZ', NULL,                           89),
(6, 'Dr. Linda Martinez','Radiologist',           'Radiology',    '+1-555-0106', 'l.martinez@medicore.com',  14, 'Active', 'Mon-Tue-Wed-Thu-Fri',         'LM', NULL,                           33)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctor_schedules (id, doctor_id, doctor_name, work_days, start_time, end_time, max_patients_per_day) VALUES
(1, 1, 'Dr. Emily Chen',    ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],                        '08:00 AM', '05:00 PM', 8),
(2, 2, 'Dr. James Wilson',  ARRAY['Monday','Tuesday','Wednesday','Thursday'],                                 '09:00 AM', '04:00 PM', 6),
(3, 3, 'Dr. Michael Brown', ARRAY['Tuesday','Wednesday','Thursday','Friday','Saturday'],                      '08:30 AM', '05:30 PM', 7),
(4, 4, 'Dr. Sarah Davis',   ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],                        '08:00 AM', '04:00 PM', 10),
(5, 5, 'Dr. Robert Zane',   ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],    '24 Hours', '24 Hours', 15),
(6, 6, 'Dr. Linda Martinez',ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],                        '09:00 AM', '05:00 PM', 5)
ON CONFLICT (id) DO NOTHING;
