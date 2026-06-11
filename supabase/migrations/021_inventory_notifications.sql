-- Trigger: inventory item status changes to Low Stock or Out of Stock → notify all staff
-- De-duplicates: skips if a notification for the same item was already sent in the last 24 hours.

CREATE OR REPLACE FUNCTION public.notify_on_inventory_low_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only act when status actually changes TO a warning state
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status IN ('Low Stock', 'Out of Stock')
  THEN
    -- Don't spam — skip if a notification for this item was sent in the last 24 hours
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE data->>'item_id' = NEW.id::text
        AND type IN ('inventory_low_stock', 'inventory_out_of_stock')
        AND created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO public.notifications (type, title, message, target_type, link, data)
      VALUES (
        CASE NEW.status
          WHEN 'Out of Stock' THEN 'inventory_out_of_stock'
          ELSE                     'inventory_low_stock'
        END,
        CASE NEW.status
          WHEN 'Out of Stock' THEN 'Item Out of Stock'
          ELSE                     'Low Stock Alert'
        END,
        NEW.name || ' (' || NEW.category || ') is ' || lower(NEW.status)
          || '. Only ' || NEW.quantity || ' ' || lower(NEW.unit)
          || ' remaining (reorder at ' || NEW.reorder_level || ').',
        'staff',
        '/inventory',
        jsonb_build_object(
          'item_id',       NEW.id,
          'item_name',     NEW.name,
          'category',      NEW.category,
          'quantity',      NEW.quantity,
          'unit',          NEW.unit,
          'reorder_level', NEW.reorder_level,
          'status',        NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_inventory_low_stock ON public.inventory;
CREATE TRIGGER on_inventory_low_stock
  AFTER UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_inventory_low_stock();
