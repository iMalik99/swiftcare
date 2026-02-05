-- Make tracking_code have a default value so it can be omitted in inserts
ALTER TABLE public.emergency_requests ALTER COLUMN tracking_code SET DEFAULT 'TEMP';

-- The trigger will still override this with the actual generated code