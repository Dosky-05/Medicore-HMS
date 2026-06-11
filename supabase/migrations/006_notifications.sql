-- ============================================================
-- Notifications system
-- Requires: 002_fix_rls_policies.sql (is_admin, is_staff)
--           005_staff_portal_access.sql (is_staff function)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL DEFAULT 'info',
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  target_type TEXT        NOT NULL DEFAULT 'staff',  -- 'staff' | 'patient'
  target_id   UUID,                                   -- specific patient UUID (patient notifications)
  link        TEXT        DEFAULT '/appointments',
  data        JSONB       DEFAULT '{}',
  read_by     UUID[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Staff see all staff-targeted notifications; patients see their own
CREATE POLICY "Read notifications"
  ON public.notifications FOR SELECT
  USING (
    (target_type = 'staff'   AND public.is_staff()) OR
    (target_type = 'patient' AND target_id = auth.uid())
  );

-- Any user who can read can also update read_by (mark as read)
CREATE POLICY "Mark as read"
  ON public.notifications FOR UPDATE
  USING (
    (target_type = 'staff'   AND public.is_staff()) OR
    (target_type = 'patient' AND target_id = auth.uid())
  )
  WITH CHECK (true);

-- Admins may insert manual broadcast notifications
CREATE POLICY "Admin insert notification"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- ── Enable Realtime ──────────────────────────────────────────
-- If this fails with "relation already member of publication"
-- your project already publishes all tables — that's fine, skip it.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object OR undefined_object THEN
  NULL; -- already included or publication doesn't exist — safe to ignore
END;
$$;

-- ── Helper RPCs (callable from the client) ───────────────────

CREATE OR REPLACE FUNCTION public.mark_notification_read(notif_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications
  SET read_by = array_append(read_by, auth.uid())
  WHERE id = notif_id
    AND NOT (auth.uid() = ANY(read_by));
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications
  SET read_by = array_append(read_by, auth.uid())
  WHERE NOT (auth.uid() = ANY(read_by))
    AND (
      (target_type = 'staff'   AND EXISTS (SELECT 1 FROM staff_profiles   WHERE id = auth.uid() AND is_active = true))
      OR
      (target_type = 'patient' AND target_id = auth.uid())
    );
$$;

-- ── Trigger: patient books via portal → notify all staff ─────

CREATE OR REPLACE FUNCTION public.notify_on_portal_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, target_type, link, data)
  VALUES (
    'new_booking',
    'New Appointment Booked',
    NEW.patient_name || ' booked with ' || NEW.doctor
      || ' on ' || to_char(NEW.date::date, 'Mon DD')
      || ' at ' || NEW.time,
    'staff',
    '/appointments',
    jsonb_build_object(
      'patient',    NEW.patient_name,
      'doctor',     NEW.doctor,
      'department', NEW.department,
      'date',       NEW.date,
      'time',       NEW.time
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_portal_booking ON public.portal_appointments;
CREATE TRIGGER on_portal_booking
  AFTER INSERT ON public.portal_appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_portal_booking();

-- ── Trigger: staff changes appointment status → notify patient

CREATE OR REPLACE FUNCTION public.notify_patient_on_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (type, title, message, target_type, target_id, link, data)
    VALUES (
      'appointment_' || lower(NEW.status),
      CASE NEW.status
        WHEN 'Confirmed' THEN 'Appointment Confirmed'
        WHEN 'Cancelled' THEN 'Appointment Cancelled'
        WHEN 'Completed' THEN 'Visit Completed'
        ELSE                  'Appointment Updated'
      END,
      CASE NEW.status
        WHEN 'Confirmed' THEN 'Your appointment with ' || NEW.doctor
          || ' on ' || to_char(NEW.date::date, 'Mon DD')
          || ' at ' || NEW.time || ' is confirmed.'
        WHEN 'Cancelled' THEN 'Your appointment with ' || NEW.doctor
          || ' on ' || to_char(NEW.date::date, 'Mon DD')
          || ' has been cancelled.'
        WHEN 'Completed' THEN 'Your visit with ' || NEW.doctor
          || ' on ' || to_char(NEW.date::date, 'Mon DD')
          || ' is marked as completed.'
        ELSE 'Your appointment with ' || NEW.doctor
          || ' has been updated to ' || NEW.status || '.'
      END,
      'patient',
      NEW.patient_id,
      '/portal/appointments',
      jsonb_build_object(
        'doctor',     NEW.doctor,
        'department', NEW.department,
        'date',       NEW.date,
        'time',       NEW.time,
        'status',     NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appointment_status_change ON public.portal_appointments;
CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE ON public.portal_appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_patient_on_status_change();
