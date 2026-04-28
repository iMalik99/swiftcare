-- Allow role-check helper functions used in access rules to run inside policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_namespace n
    JOIN pg_proc p ON p.pronamespace = n.oid
    WHERE n.nspname = 'private'
      AND p.proname = 'has_role'
  ) THEN
    GRANT USAGE ON SCHEMA private TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_namespace n
    JOIN pg_proc p ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'has_role'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
  END IF;
END $$;

-- Ensure request automation triggers exist
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