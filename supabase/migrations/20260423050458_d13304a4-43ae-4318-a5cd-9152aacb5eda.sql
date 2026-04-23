-- Stores table
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  department_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View stores"
  ON public.stores FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'stores.view') AND user_can_access_scope(auth.uid(), department_id));

CREATE POLICY "Create stores"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'stores.create'));

CREATE POLICY "Edit stores"
  ON public.stores FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'stores.edit'));

CREATE POLICY "Remove stores"
  ON public.stores FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'stores.delete'));

-- Permissions
INSERT INTO public.permissions (code, name, category, description) VALUES
  ('stores.view',   'View Stores',   'Stores', 'View stores'),
  ('stores.create', 'Create Stores', 'Stores', 'Create stores'),
  ('stores.edit',   'Edit Stores',   'Stores', 'Edit stores'),
  ('stores.delete', 'Delete Stores', 'Stores', 'Delete stores')
ON CONFLICT (code) DO NOTHING;

-- Grant to Admin role if it exists
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id
FROM public.custom_roles cr
CROSS JOIN public.permissions p
WHERE cr.name = 'Admin'
  AND p.code IN ('stores.view','stores.create','stores.edit','stores.delete')
ON CONFLICT DO NOTHING;