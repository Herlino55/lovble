
CREATE TABLE public.delivery_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view expenses" ON public.delivery_expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin can insert expenses" ON public.delivery_expenses
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can update expenses" ON public.delivery_expenses
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin can delete expenses" ON public.delivery_expenses
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
