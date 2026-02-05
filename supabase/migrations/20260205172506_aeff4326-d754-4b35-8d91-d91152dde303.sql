-- Fix the overly permissive RLS policy for emergency requests INSERT
DROP POLICY IF EXISTS "Anyone can create emergency request" ON public.emergency_requests;

-- Public can create emergency requests (this is intentional for the system)
-- But we add validation that required fields are present
CREATE POLICY "Anyone can create emergency request" ON public.emergency_requests
  FOR INSERT WITH CHECK (
    requester_phone IS NOT NULL 
    AND emergency_type IS NOT NULL 
    AND location_lat IS NOT NULL 
    AND location_lng IS NOT NULL
  );