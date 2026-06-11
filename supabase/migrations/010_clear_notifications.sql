-- ============================================================
-- Clear notifications (dismiss without deleting the row).
-- Uses a cleared_by UUID[] so each user has their own view.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS cleared_by UUID[] DEFAULT '{}';

-- ── Refresh SELECT policy to hide cleared notifications ──────
DROP POLICY IF EXISTS "Read notifications" ON public.notifications;

CREATE POLICY "Read notifications"
  ON public.notifications FOR SELECT
  USING (
    (
      target_type = 'staff'
      AND public.is_staff()
      AND (
        (target_id IS NULL AND NOT public.is_doctor())
        OR (target_id = auth.uid())
      )
      AND NOT (auth.uid() = ANY(COALESCE(cleared_by, '{}')))
    )
    OR
    (
      target_type = 'patient'
      AND target_id = auth.uid()
      AND NOT (auth.uid() = ANY(COALESCE(cleared_by, '{}')))
    )
  );

-- ── clear_notification: dismiss a single notification ────────
CREATE OR REPLACE FUNCTION public.clear_notification(notif_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications
  SET cleared_by = array_append(COALESCE(cleared_by, '{}'), auth.uid())
  WHERE id = notif_id
    AND NOT (auth.uid() = ANY(COALESCE(cleared_by, '{}')));
$$;

-- ── clear_all_notifications: dismiss everything visible ──────
CREATE OR REPLACE FUNCTION public.clear_all_notifications()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications
  SET cleared_by = array_append(COALESCE(cleared_by, '{}'), auth.uid())
  WHERE NOT (auth.uid() = ANY(COALESCE(cleared_by, '{}')))
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

-- ── Update mark_all_notifications_read to skip cleared ───────
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications
  SET read_by = array_append(read_by, auth.uid())
  WHERE NOT (auth.uid() = ANY(read_by))
    AND NOT (auth.uid() = ANY(COALESCE(cleared_by, '{}')))
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
