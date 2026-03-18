
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS on user_roles: users can read their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Auto-assign first user as superadmin, others as user
CREATE OR REPLACE FUNCTION public.assign_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_role_on_signup();

-- 6. Update RLS policies on deliveries
DROP POLICY IF EXISTS "Users can create their own deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can update their own deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can delete their own deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can view their own deliveries" ON public.deliveries;

CREATE POLICY "Anyone authenticated can view deliveries"
  ON public.deliveries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Superadmin can insert deliveries"
  ON public.deliveries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update deliveries"
  ON public.deliveries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete deliveries"
  ON public.deliveries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- 7. Update RLS policies on clients
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;

CREATE POLICY "Anyone authenticated can view clients"
  ON public.clients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Superadmin can insert clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- 8. Update RLS policies on delivery_comments
DROP POLICY IF EXISTS "Users can add comments to their deliveries" ON public.delivery_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.delivery_comments;
DROP POLICY IF EXISTS "Users can view comments on their deliveries" ON public.delivery_comments;

CREATE POLICY "Anyone authenticated can view comments"
  ON public.delivery_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Superadmin can insert comments"
  ON public.delivery_comments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete comments"
  ON public.delivery_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));
