-- ============================================================
-- Patient cancel appointment RPC
-- Patients cannot UPDATE portal_appointments directly (no policy).
-- This SECURITY DEFINER function verifies ownership, cancels the
-- appointment, and notifies all staff in one atomic operation.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.patient_cancel_appointment(appt_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_appt public.portal_appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_appt FROM public.portal_appointments WHERE id = appt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Only the patient who owns the appointment can cancel it
  IF v_appt.patient_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorised to cancel this appointment';
  END IF;

  -- Can only cancel Scheduled or Confirmed appointments
  IF v_appt.status NOT IN ('Scheduled', 'Confirmed') THEN
    RAISE EXCEPTION 'Cannot cancel appointment with status: %', v_appt.status;
  END IF;

  -- Cancel it (the existing on_appointment_status_change trigger will also
  -- fire and send an appointment_cancelled notification back to the patient)
  UPDATE public.portal_appointments SET status = 'Cancelled' WHERE id = appt_id;

  -- Notify all staff
  INSERT INTO public.notifications (type, title, message, target_type, link, data)
  VALUES (
    'appointment_cancelled_by_patient',
    'Appointment Cancelled by Patient',
    v_appt.patient_name || ' cancelled their appointment with ' || v_appt.doctor
      || ' on ' || to_char(v_appt.date::date, 'Mon DD, YYYY') || ' at ' || v_appt.time || '.',
    'staff',
    '/appointments',
    jsonb_build_object(
      'patient',    v_appt.patient_name,
      'doctor',     v_appt.doctor,
      'department', v_appt.department,
      'date',       v_appt.date,
      'time',       v_appt.time
    )
  );
END;
$$;
