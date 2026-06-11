-- Fix: notification message now reads
-- "John Doe booked an appointment with Dr. Smith for Jun 10 at 10:00 AM"
-- Run in: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION public.notify_on_portal_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, target_type, link, data)
  VALUES (
    'new_booking',
    'New Appointment Booked',
    NEW.patient_name
      || ' booked an appointment with ' || NEW.doctor
      || ' for ' || to_char(NEW.date::date, 'Mon DD')
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
