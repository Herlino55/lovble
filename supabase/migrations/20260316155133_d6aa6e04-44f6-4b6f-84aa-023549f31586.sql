DROP POLICY IF EXISTS "Superadmin can insert deliveries" ON public.deliveries;
CREATE POLICY "Superadmin or creator can insert deliveries"
ON public.deliveries
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'delivery_creator')
);

CREATE POLICY "Superadmin can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  AND role IN ('user', 'delivery_creator')
);

CREATE POLICY "Superadmin can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  AND role = 'delivery_creator'
);

CREATE POLICY "Superadmin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));