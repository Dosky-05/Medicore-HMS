-- General (non-pharmaceutical) inventory table
create table if not exists inventory (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text,
  quantity       integer not null default 0,
  unit           text not null default 'Pieces',
  reorder_level  integer not null default 10,
  supplier       text,
  cost_per_unit  numeric(10,2) default 0,
  last_restocked date,
  status         text not null default 'In Stock',
  created_at     timestamptz default now()
);

-- Staff (authenticated users) can read and write
alter table inventory enable row level security;

create policy "Staff can read inventory"
  on inventory for select
  to authenticated
  using (true);

create policy "Staff can insert inventory"
  on inventory for insert
  to authenticated
  with check (true);

create policy "Staff can update inventory"
  on inventory for update
  to authenticated
  using (true);

create policy "Admin can delete inventory"
  on inventory for delete
  to authenticated
  using (true);

-- Seed data
insert into inventory (name, category, quantity, unit, reorder_level, supplier, cost_per_unit, last_restocked, status) values

-- PPE
('Surgical Face Masks',        'PPE', 1200, 'Pieces',  200, 'SafeMed Supplies',     0.15, '2026-05-20', 'In Stock'),
('N95 Respirator Masks',       'PPE',   80, 'Pieces',  100, 'SafeMed Supplies',     2.50, '2026-05-10', 'Low Stock'),
('Nitrile Examination Gloves', 'PPE',   45, 'Boxes',    50, 'GloveTech Ltd',        8.00, '2026-05-18', 'Low Stock'),
('Latex Surgical Gloves',      'PPE',   60, 'Boxes',    30, 'GloveTech Ltd',        6.50, '2026-05-15', 'In Stock'),
('Disposable Isolation Gowns', 'PPE',  300, 'Pieces',  100, 'MedWear Pro',          1.20, '2026-06-01', 'In Stock'),
('Face Shields',               'PPE',   25, 'Pieces',   20, 'SafeMed Supplies',     3.75, '2026-04-28', 'In Stock'),
('Safety Goggles',             'PPE',   18, 'Pieces',   10, 'SafeMed Supplies',     4.20, '2026-04-10', 'In Stock'),
('Disposable Shoe Covers',     'PPE',  500, 'Pieces',  150, 'MedWear Pro',          0.10, '2026-05-25', 'In Stock'),

-- Cleaning Supplies
('Hospital Grade Disinfectant Spray', 'Cleaning Supplies',  40, 'Bottles', 20, 'CleanPro Medical',  4.80, '2026-05-30', 'In Stock'),
('Floor Cleaning Solution',           'Cleaning Supplies',  15, 'Liters',  20, 'CleanPro Medical',  3.20, '2026-05-12', 'Low Stock'),
('Alcohol Hand Sanitizer (500ml)',     'Cleaning Supplies',  90, 'Bottles', 30, 'HygieneFirst Ltd',  2.50, '2026-06-02', 'In Stock'),
('Bleach Disinfectant (1L)',           'Cleaning Supplies',  22, 'Bottles', 15, 'CleanPro Medical',  1.80, '2026-05-08', 'In Stock'),
('Disinfectant Surface Wipes',        'Cleaning Supplies',  35, 'Packs',   20, 'HygieneFirst Ltd',  3.00, '2026-05-27', 'In Stock'),
('Heavy-Duty Trash Bags (100pcs)',     'Cleaning Supplies',   8, 'Packs',   10, 'OfficeMax Medical', 5.50, '2026-04-20', 'Low Stock'),
('Mop Heads (Replacement)',           'Cleaning Supplies',   0, 'Pieces',   5, 'CleanPro Medical',  3.00, '2026-03-15', 'Out of Stock'),
('Toilet Paper (48-roll pack)',        'Cleaning Supplies',  12, 'Packs',    8, 'OfficeMax Medical', 9.00, '2026-05-22', 'In Stock'),

-- Linens
('Hospital Bed Sheets (Single)',  'Linens', 120, 'Pieces', 40, 'TextileMed Co.',  8.00, '2026-05-05', 'In Stock'),
('Patient Pillowcases',           'Linens',  85, 'Pieces', 40, 'TextileMed Co.',  3.50, '2026-05-05', 'In Stock'),
('Patient Gowns',                 'Linens',  60, 'Pieces', 30, 'MedWear Pro',     6.00, '2026-04-30', 'In Stock'),
('Surgical Drapes (Sterile)',     'Linens',  25, 'Packs',  15, 'SterileSupply',  12.00, '2026-05-18', 'In Stock'),
('Bath Towels',                   'Linens',  40, 'Pieces', 20, 'TextileMed Co.',  4.00, '2026-04-15', 'In Stock'),
('Thermal Blankets',              'Linens',  18, 'Pieces', 20, 'TextileMed Co.',  9.50, '2026-04-10', 'Low Stock'),

-- Consumables
('Disposable Syringes 5ml',       'Consumables', 800, 'Pieces', 200, 'SterileSupply',   0.20, '2026-06-01', 'In Stock'),
('Disposable Syringes 10ml',      'Consumables', 600, 'Pieces', 200, 'SterileSupply',   0.25, '2026-06-01', 'In Stock'),
('IV Cannula 20G',                'Consumables', 150, 'Pieces',  50, 'SterileSupply',   0.80, '2026-05-20', 'In Stock'),
('IV Drip Set (Infusion Set)',    'Consumables',  90, 'Pieces',  50, 'MedDevice Ltd',   0.60, '2026-05-15', 'In Stock'),
('Cotton Wool Rolls (500g)',      'Consumables',  30, 'Rolls',   15, 'PharmaCare',      2.50, '2026-05-10', 'In Stock'),
('Sterile Gauze Swabs (10x10cm)','Consumables', 400, 'Pieces', 100, 'SterileSupply',   0.10, '2026-05-25', 'In Stock'),
('Crepe Bandages (10cm)',         'Consumables',  45, 'Rolls',   20, 'PharmaCare',      1.20, '2026-05-18', 'In Stock'),
('Adhesive Plasters (Box of 100)','Consumables',  12, 'Boxes',   10, 'PharmaCare',      3.00, '2026-05-02', 'In Stock'),
('Sterile Dressing Pads',         'Consumables', 200, 'Pieces',  80, 'SterileSupply',   0.35, '2026-06-03', 'In Stock'),
('Urine Collection Bags',         'Consumables',  40, 'Pieces',  20, 'MedDevice Ltd',   1.50, '2026-05-08', 'In Stock'),
('Oxygen Masks (Adult)',          'Consumables',  15, 'Pieces',  20, 'MedDevice Ltd',   4.50, '2026-04-22', 'Low Stock'),
('Nasogastric Tubes (14Fr)',      'Consumables',   8, 'Pieces',  10, 'MedDevice Ltd',   3.00, '2026-04-05', 'Low Stock'),
('Tongue Depressors (Box of 100)','Consumables',  20, 'Boxes',   10, 'PharmaCare',      2.00, '2026-05-14', 'In Stock'),

-- Office Supplies
('A4 Printing Paper (500 sheets)', 'Office Supplies',  25, 'Packs',  10, 'OfficeMax Medical',  4.50, '2026-05-28', 'In Stock'),
('Ballpoint Pens (Box of 50)',     'Office Supplies',   8, 'Boxes',   5, 'OfficeMax Medical',  6.00, '2026-05-01', 'In Stock'),
('Patient File Folders',           'Office Supplies', 150, 'Pieces',  50, 'OfficeMax Medical',  0.80, '2026-04-18', 'In Stock'),
('Printer Ink Cartridges (Black)', 'Office Supplies',   3, 'Pieces',   4, 'OfficeMax Medical', 22.00, '2026-04-10', 'Low Stock'),
('Surgical Marker Pens',           'Office Supplies',  18, 'Pieces',  10, 'SafeMed Supplies',   1.50, '2026-05-16', 'In Stock'),
('Sticky Notes (Pack of 5)',       'Office Supplies',  12, 'Packs',    5, 'OfficeMax Medical',  2.00, '2026-05-03', 'In Stock'),

-- Equipment
('Digital Thermometers',          'Equipment',  15, 'Pieces',  5, 'MediEquip Ltd',   8.00, '2026-03-20', 'In Stock'),
('Blood Pressure Cuffs (Adult)',   'Equipment',   8, 'Pieces',  4, 'MediEquip Ltd',  25.00, '2026-03-20', 'In Stock'),
('Pulse Oximeters',                'Equipment',   6, 'Pieces',  4, 'MediEquip Ltd',  18.00, '2026-03-20', 'In Stock'),
('Stethoscopes',                   'Equipment',  10, 'Pieces',  5, 'MediEquip Ltd',  35.00, '2026-02-14', 'In Stock'),
('Otoscopes',                      'Equipment',   3, 'Pieces',  3, 'MediEquip Ltd',  65.00, '2026-01-10', 'Low Stock'),
('Reflex Hammers',                 'Equipment',   7, 'Pieces',  3, 'MediEquip Ltd',  12.00, '2026-02-14', 'In Stock'),
('Wheelchair (Standard)',          'Equipment',   4, 'Pieces',  2, 'MobilityPlus',  180.00, '2025-11-05', 'In Stock'),
('IV Drip Stands',                 'Equipment',   9, 'Pieces',  4, 'MediEquip Ltd',  45.00, '2025-12-20', 'In Stock');
