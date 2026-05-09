-- Restore request tracking and dispatch triggers for emergency submissions
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.tracking_code = 'SC-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_dispatch_ambulance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nearest_ambulance RECORD;
BEGIN
  IF NEW.status = 'pending' AND NEW.assigned_ambulance_id IS NULL THEN
    SELECT a.id, a.driver_id,
           SQRT(POWER(COALESCE(a.current_lat, 9.0579) - NEW.location_lat, 2) +
                POWER(COALESCE(a.current_lng, 7.4951) - NEW.location_lng, 2)) AS distance
    INTO nearest_ambulance
    FROM public.ambulances a
    WHERE a.status = 'available'
      AND a.driver_id IS NOT NULL
    ORDER BY distance ASC
    LIMIT 1;

    IF nearest_ambulance.id IS NOT NULL THEN
      NEW.assigned_ambulance_id = nearest_ambulance.id;
      NEW.assigned_driver_id = nearest_ambulance.driver_id;
      NEW.status = 'assigned';

      UPDATE public.ambulances
      SET status = 'busy', updated_at = now()
      WHERE id = nearest_ambulance.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tracking_code ON public.emergency_requests;
CREATE TRIGGER set_tracking_code
  BEFORE INSERT ON public.emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_code();

DROP TRIGGER IF EXISTS trigger_auto_dispatch ON public.emergency_requests;
CREATE TRIGGER trigger_auto_dispatch
  BEFORE INSERT ON public.emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_dispatch_ambulance();

DROP TRIGGER IF EXISTS update_emergency_requests_updated_at ON public.emergency_requests;
CREATE TRIGGER update_emergency_requests_updated_at
  BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();