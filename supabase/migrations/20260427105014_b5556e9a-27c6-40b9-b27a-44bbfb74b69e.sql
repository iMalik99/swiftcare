CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

ALTER POLICY "Admins can manage ambulances" ON public.ambulances
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can manage requests" ON public.emergency_requests
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can manage profiles" ON public.profiles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can view all profiles" ON public.profiles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can manage roles" ON public.user_roles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);