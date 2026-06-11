-- ============================================================
-- Doctors only see notifications for their own appointments.
-- Non-doctor staff (receptionist, nurse, admin) see all bookings.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Helper: true only for active doctors
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles
    WHERE id = auth.uid() AND role = 'doctor' AND is_active = true
  );
$$;

-- ── Update SELECT policy ─────────────────────────────────────
-- Non-doctor staff : see general broadcast notifications (target_id IS NULL)
-- Doctors          : see only their own targeted notifications (target_id = their UUID)
-- Patients         : see their own patient notifications

DROP POLICY IF EXISTS "Read notifications" ON public.notifications;

CREATE POLICY "Read notifications"
  ON public.notifications FOR SELECT
  USING (
    (
      target_type = 'staff'
      AND public.is_staff()
      AND (
        (target_id IS NULL     AND NOT public.is_doctor())
        OR (target_id = auth.uid())
      )
    )
    OR
    (target_type = 'patient' AND target_id = auth.uid())
  );

-- ── Update mark_all_notifications_read ───────────────────────
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications
  SET read_by = array_append(read_by, auth.uid())
  WHERE NOT (auth.uid() = ANY(read_by))
    AND (
      (target_type = 'patient' AND target_id = auth.uid())
      OR (
        target_type = 'staff'
        AND EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND is_active = true)
        AND (
          (target_id IS NULL AND NOT EXISTS (
            SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND role = 'doctor'
          ))
          OR target_id = auth.uid()
        )
      )
    );
$$;

-- ── Updated booking trigger ──────────────────────────────────
-- Creates two rows:
--   1. Broadcast (target_id NULL)  → receptionists / nurses / admins
--   2. Targeted  (target_id = doctor's user UUID) → the specific doctor (if they have an account)

CREATE OR REPLACE FUNCTION public.notify_on_portal_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doctor_user_id UUID;
  v_staff_message  TEXT;
  v_doctor_message TEXT;
BEGIN
  -- Message for receptionists/nurses/admins — includes doctor's name
  v_staff_message := NEW.patient_name
    || ' booked an appointment for '
    || to_char(NEW.date::date, 'Mon DD')
    || ' at ' || NEW.time
    || ' with ' || NEW.doctor;

  -- Message for the doctor themselves — says "with you" instead of their name
  v_doctor_message := NEW.patient_name
    || ' booked an appointment with you for '
    || to_char(NEW.date::date, 'Mon DD')
    || ' at ' || NEW.time;

  -- Broadcast: all non-doctor staff
  INSERT INTO public.notifications (type, title, message, target_type, target_id, link, data)
  VALUES (
    'new_booking', 'New Appointment Booked', v_staff_message,
    'staff', NULL, '/appointments',
    jsonb_build_object(
      'patient', NEW.patient_name, 'doctor', NEW.doctor,
      'department', NEW.department, 'date', NEW.date, 'time', NEW.time
    )
  );

  -- Targeted: the specific doctor (only if they have a login account)
  SELECT id INTO v_doctor_user_id
  FROM public.staff_profiles
  WHERE doctor_id = NEW.doctor_id AND role = 'doctor'
  LIMIT 1;

  IF v_doctor_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (type, title, message, target_type, target_id, link, data)
    VALUES (
      'new_booking', 'New Patient Appointment', v_doctor_message,
      'staff', v_doctor_user_id, '/appointments',
      jsonb_build_object(
        'patient', NEW.patient_name, 'doctor', NEW.doctor,
        'department', NEW.department, 'date', NEW.date, 'time', NEW.time
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
