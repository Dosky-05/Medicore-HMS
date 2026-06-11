-- ============================================================
-- Laboratory Orders
-- Tracks lab test orders: staff create orders, enter results,
-- and patients see completed results in the portal.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lab_orders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name  TEXT        NOT NULL,
  ordered_by    TEXT        NOT NULL,
  department    TEXT,
  test_name     TEXT        NOT NULL,
  test_type     TEXT        NOT NULL DEFAULT 'Hematology',
  ordered_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  priority      TEXT        NOT NULL DEFAULT 'Normal'
                            CHECK (priority IN ('Normal', 'Urgent', 'STAT')),
  status        TEXT        NOT NULL DEFAULT 'Pending'
                            CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  results       TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

-- All active staff can view, create, and update lab orders
CREATE POLICY "Staff manage lab orders"
  ON public.lab_orders FOR ALL
  USING  (public.is_staff())
  WITH CHECK (public.is_staff());

-- Patients can only read their own completed orders
CREATE POLICY "Patient reads own lab orders"
  ON public.lab_orders FOR SELECT
  USING (patient_id IS NOT NULL AND patient_id = auth.uid());

-- ── Notification trigger ─────────────────────────────────────
-- Fires when a lab order is marked Completed; notifies the patient.

CREATE OR REPLACE FUNCTION public.notify_on_lab_results()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'Completed'
     AND NEW.patient_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Completed')
  THEN
    INSERT INTO public.notifications
      (type, title, message, target_type, target_id, link, data)
    VALUES (
      'lab_results_ready',
      'Lab Results Ready',
      'Your ' || NEW.test_name || ' results are now available.',
      'patient',
      NEW.patient_id,
      '/portal/records',
      jsonb_build_object('test_name', NEW.test_name, 'test_type', NEW.test_type)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lab_results_ready ON public.lab_orders;
CREATE TRIGGER on_lab_results_ready
  AFTER INSERT OR UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_lab_results();
