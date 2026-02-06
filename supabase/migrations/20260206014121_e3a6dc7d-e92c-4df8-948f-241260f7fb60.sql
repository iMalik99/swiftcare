-- Create auto-dispatch function
CREATE OR REPLACE FUNCTION public.auto_dispatch_ambulance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nearest_ambulance RECORD;
BEGIN
  -- Only run for new pending requests
  IF NEW.status = 'pending' AND NEW.assigned_ambulance_id IS NULL THEN
    -- Find nearest available ambulance with a driver assigned
    SELECT a.id, a.driver_id, 
           SQRT(POWER(COALESCE(a.current_lat, 9.0579) - NEW.location_lat, 2) + 
                POWER(COALESCE(a.current_lng, 7.4951) - NEW.location_lng, 2)) as distance
    INTO nearest_ambulance
    FROM ambulances a
    WHERE a.status = 'available' 
      AND a.driver_id IS NOT NULL
    ORDER BY distance ASC
    LIMIT 1;
    
    -- If an ambulance is found, assign it
    IF nearest_ambulance.id IS NOT NULL THEN
      NEW.assigned_ambulance_id = nearest_ambulance.id;
      NEW.assigned_driver_id = nearest_ambulance.driver_id;
      NEW.status = 'assigned';
      
      -- Update ambulance status to busy
      UPDATE ambulances 
      SET status = 'busy', updated_at = now()
      WHERE id = nearest_ambulance.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-dispatch on insert
DROP TRIGGER IF EXISTS trigger_auto_dispatch ON emergency_requests;
CREATE TRIGGER trigger_auto_dispatch
  BEFORE INSERT ON emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_dispatch_ambulance();