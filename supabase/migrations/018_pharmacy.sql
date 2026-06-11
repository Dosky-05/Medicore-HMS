-- ============================================================
-- Pharmacy / medicine inventory table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pharmacy (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT         NOT NULL,
  category      TEXT,
  stock         INTEGER      NOT NULL DEFAULT 0,
  unit          TEXT         NOT NULL DEFAULT 'Tablets',
  reorder_level INTEGER      NOT NULL DEFAULT 0,
  supplier      TEXT,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  status        TEXT         NOT NULL DEFAULT 'In Stock'
                CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage pharmacy"
  ON public.pharmacy FOR ALL
  USING  (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── Seed default medicines ───────────────────────────────────
INSERT INTO public.pharmacy (name, category, stock, unit, reorder_level, supplier, price, status) VALUES
  ('Lisinopril 10mg',    'Cardiovascular',   450,  'Tablets',  100, 'PharmaCo',     0.45,  'In Stock'),
  ('Metformin 500mg',    'Diabetes',         320,  'Tablets',  150, 'MediSupply',   0.30,  'In Stock'),
  ('Amoxicillin 500mg',  'Antibiotics',       85,  'Capsules', 100, 'PharmaCo',     0.80,  'Low Stock'),
  ('Paracetamol 500mg',  'Analgesic',       1200,  'Tablets',  200, 'GenericMeds',  0.15,  'In Stock'),
  ('Omeprazole 20mg',    'Gastrointestinal',   0,  'Capsules', 100, 'MediSupply',   0.60,  'Out of Stock'),
  ('Atorvastatin 40mg',  'Cardiovascular',   280,  'Tablets',  100, 'PharmaCo',     0.95,  'In Stock'),
  ('Salbutamol Inhaler', 'Respiratory',       45,  'Units',     50, 'RespiCare',   12.50,  'Low Stock'),
  ('Insulin Glargine',   'Diabetes',         120,  'Vials',     40, 'DiabetesCare', 85.00, 'In Stock'),
  ('Warfarin 5mg',       'Anticoagulant',    200,  'Tablets',   80, 'PharmaCo',     0.55,  'In Stock'),
  ('Morphine 10mg/ml',   'Pain Management',   30,  'Vials',     20, 'SpecialtyMeds',45.00, 'In Stock')
ON CONFLICT DO NOTHING;
