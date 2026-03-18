
-- Function to get the parent_id (or own id if superadmin) for RLS
CREATE OR REPLACE FUNCTION public.get_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_id FROM public.profiles WHERE user_id = _user_id AND parent_id IS NOT NULL),
    _user_id
  )
$$;

-- Update INSERT policy
DROP POLICY IF EXISTS "Superadmin or creator can insert deliveries" ON public.deliveries;
CREATE POLICY "Superadmin or creator can insert deliveries" ON public.deliveries
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role)
  OR (has_role(auth.uid(), 'delivery_creator'::app_role) AND user_id = get_owner_id(auth.uid()))
);

-- Update UPDATE policy
DROP POLICY IF EXISTS "Superadmin can update deliveries" ON public.deliveries;
CREATE POLICY "Superadmin or updater can update deliveries" ON public.deliveries
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
  OR (has_role(auth.uid(), 'delivery_updater'::app_role) AND user_id = get_owner_id(auth.uid()))
);

-- Update DELETE policy
DROP POLICY IF EXISTS "Superadmin can delete deliveries" ON public.deliveries;
CREATE POLICY "Superadmin or deleter can delete deliveries" ON public.deliveries
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
  OR (has_role(auth.uid(), 'delivery_deleter'::app_role) AND user_id = get_owner_id(auth.uid()))
);

-- Allow superadmin to insert/delete the new roles
DROP POLICY IF EXISTS "Superadmin can insert user roles" ON public.user_roles;
CREATE POLICY "Superadmin can insert user roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role)
  AND role IN ('user'::app_role, 'delivery_creator'::app_role, 'delivery_updater'::app_role, 'delivery_deleter'::app_role)
);

DROP POLICY IF EXISTS "Superadmin can delete user roles" ON public.user_roles;
CREATE POLICY "Superadmin can delete user roles" ON public.user_roles
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
  AND role IN ('delivery_creator'::app_role, 'delivery_updater'::app_role, 'delivery_deleter'::app_role)
);
