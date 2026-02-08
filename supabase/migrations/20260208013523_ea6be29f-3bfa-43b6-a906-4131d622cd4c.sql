
-- 1. Add base station coordinates to ambulances (never changes, used for reset after completion)
ALTER TABLE public.ambulances ADD COLUMN base_lat double precision;
ALTER TABLE public.ambulances ADD COLUMN base_lng double precision;

-- 2. Populate base coordinates from current data (all except ABJ-003-SC which got corrupted)
UPDATE public.ambulances SET base_lat = current_lat, base_lng = current_lng WHERE plate_number != 'ABJ-003-SC';

-- 3. Fix ABJ-003-SC: restore original station coordinates from seed data
UPDATE public.ambulances 
SET base_lat = 9.0820, base_lng = 7.5350, 
    current_lat = 9.0820, current_lng = 7.5350
WHERE plate_number = 'ABJ-003-SC';

-- 4. Add a PERMISSIVE SELECT policy so tracking page (unauthenticated) can read ambulance plate numbers
CREATE POLICY "Public can view ambulances"
ON public.ambulances
FOR SELECT
USING (true);
