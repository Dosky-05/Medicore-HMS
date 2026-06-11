-- ============================================================
-- Prescriptions table
-- Doctors issue prescriptions after completing appointments.
-- Portal patients can view their own in /portal/prescriptions.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID,           -- portal_appointments.id; NULL for staff-created appointments
  patient_id     UUID,           -- patient auth UUID; NULL if patient has no portal account
  patient_name   TEXT NOT NULL,
  doctor_name    TEXT NOT NULL,
  department     TEXT,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  medicines      JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions   TEXT,
  status         TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active', 'Completed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Staff (any active role) can create, read, and update prescriptions
CREATE POLICY "Staff manage prescriptions"
  ON public.prescriptions FOR ALL
  USING  (public.is_staff())
  WITH CHECK (public.is_staff());

-- Patients can read only their own prescriptions
CREATE POLICY "Patient reads own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (patient_id IS NOT NULL AND patient_id = auth.uid());

-- ── Notification trigger ─────────────────────────────────────
-- Fires when a new prescription is issued; notifies the patient.

CREATE OR REPLACE FUNCTION public.notify_on_prescription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.patient_id IS NOT NULL THEN
    INSERT INTO public.notifications
      (type, title, message, target_type, target_id, link, data)
    VALUES (
      'prescription_issued',
      'New Prescription',
      NEW.doctor_name
        || ' has issued a prescription for your appointment on '
        || to_char(NEW.date::date, 'Mon DD'),
      'patient',
      NEW.patient_id,
      '/portal/prescriptions',
      jsonb_build_object('doctor', NEW.doctor_name, 'date', NEW.date)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_prescription_issued ON public.prescriptions;
CREATE TRIGGER on_prescription_issued
  AFTER INSERT ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_prescription();
