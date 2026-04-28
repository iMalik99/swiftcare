-- Restore missing triggers for emergency request submission and dispatch
DROP TRIGGER IF EXISTS update_emergency_requests_updated_at ON public.emergency_requests;
CREATE TRIGGER update_emergency_requests_updated_at
  BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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