-- ============================================================
-- Add days_off column + allow doctors to edit their own schedule
-- ============================================================

ALTER TABLE public.doctor_schedules
  ADD COLUMN IF NOT EXISTS days_off TEXT[] DEFAULT '{}';

-- Allow doctors to update their own schedule row
-- staff_profiles.id IS the auth user id; doctor_id is text so cast to bigint
CREATE POLICY "Doctor update own schedule"
  ON public.doctor_schedules FOR UPDATE
  USING (
    doctor_id = (
      SELECT doctor_id::bigint FROM public.staff_profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    doctor_id = (
      SELECT doctor_id::bigint FROM public.staff_profiles
      WHERE id = auth.uid()
    )
  );
