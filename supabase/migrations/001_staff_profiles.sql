-- ============================================================
-- MediCore HMS — Staff Profiles
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Staff profiles: one row per HMS user, linked to auth.users
create table if not exists public.staff_profiles (
  id          uuid        references auth.users(id) on delete cascade primary key,
  name        text        not null,
  email       text        not null,
  role        text        not null check (role in ('admin', 'doctor', 'nurse', 'receptionist')),
  doctor_id   text        default null,   -- populated when role = 'doctor'
  department  text        default null,
  phone       text        default null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table public.staff_profiles enable row level security;

-- Every authenticated user can read their own profile
create policy "Read own profile"
  on public.staff_profiles for select
  using (auth.uid() = id);

-- Admins (JWT role = 'admin') can read all profiles
create policy "Admin reads all profiles"
  on public.staff_profiles for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admins can insert new staff profiles
create policy "Admin inserts profiles"
  on public.staff_profiles for insert
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admins can update any profile (e.g. deactivate, change role)
create policy "Admin updates profiles"
  on public.staff_profiles for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admins can hard-delete a profile
create policy "Admin deletes profiles"
  on public.staff_profiles for delete
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ── Bootstrap your first admin ──────────────────────────────
-- 1. Create your admin account in Supabase Dashboard →
--    Authentication → Users → Add User.
--    Set email + password. Copy the UUID shown.
--
-- 2. Run this (replace the values):
--
-- insert into public.staff_profiles (id, name, email, role)
-- values (
--   '<paste-auth-user-uuid-here>',
--   'Your Full Name',
--   'admin@yourhospital.com',
--   'admin'
-- );
--
-- 3. In Supabase Dashboard → Authentication → Users, click that user
--    → Edit user metadata → add:
--    { "role": "admin", "name": "Your Full Name" }
--
-- After that, all future staff accounts are created from the app's
-- Settings → Staff Accounts page.
-- ─────────────────────────────────────────────────────────────
