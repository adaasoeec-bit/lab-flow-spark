
-- ============================================
-- Permission-Based Access Control System
-- ============================================

-- 1. Create new tables
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'all',
  scope_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- 3. RLS for new tables
CREATE POLICY "Roles viewable" ON public.custom_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages roles" ON public.custom_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permissions viewable" ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Role perms viewable" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages role perms" ON public.role_permissions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "View assignments" ON public.user_role_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'avd'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));
CREATE POLICY "Admin manages assignments" ON public.user_role_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Security definer functions
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission_code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      JOIN role_permissions rp ON rp.role_id = ura.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ura.user_id = _user_id AND p.code = _permission_code
    )
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_scope(_user_id uuid, _dept_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    _dept_id IS NULL
    OR has_role(_user_id, 'admin'::app_role)
    OR (SELECT department_id FROM profiles WHERE id = _user_id) = _dept_id
    OR EXISTS (
      SELECT 1 FROM user_role_assignments ura
      WHERE ura.user_id = _user_id
      AND (
        ura.scope = 'all'
        OR (ura.scope = 'department' AND ura.scope_id = _dept_id)
        OR (ura.scope = 'college' AND ura.scope_id = (SELECT college_id FROM departments WHERE id = _dept_id))
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.code FROM permissions p WHERE has_role(_user_id, 'admin'::app_role)
  UNION
  SELECT p.code
  FROM user_role_assignments ura
  JOIN role_permissions rp ON rp.role_id = ura.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ura.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_info(_user_id uuid)
RETURNS TABLE(role_name text, role_scope text, role_scope_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cr.name, ura.scope, ura.scope_id
  FROM user_role_assignments ura
  JOIN custom_roles cr ON cr.id = ura.role_id
  WHERE ura.user_id = _user_id
  LIMIT 1
$$;

-- 5. Seed permissions
INSERT INTO permissions (code, name, category) VALUES
  ('dashboard.view', 'View Dashboard', 'Dashboard'),
  ('lab_sessions.view', 'View Lab Sessions', 'Lab Sessions'),
  ('lab_sessions.create', 'Create Lab Sessions', 'Lab Sessions'),
  ('lab_sessions.edit', 'Edit Lab Sessions', 'Lab Sessions'),
  ('lab_sessions.delete', 'Delete Lab Sessions', 'Lab Sessions'),
  ('equipment.view', 'View Equipment', 'Equipment'),
  ('equipment.create', 'Create Equipment', 'Equipment'),
  ('equipment.edit', 'Edit Equipment', 'Equipment'),
  ('equipment.delete', 'Delete Equipment', 'Equipment'),
  ('maintenance.view', 'View Maintenance', 'Maintenance'),
  ('maintenance.create', 'Create Maintenance', 'Maintenance'),
  ('maintenance.edit', 'Edit Maintenance', 'Maintenance'),
  ('maintenance.delete', 'Delete Maintenance', 'Maintenance'),
  ('maintenance.approve', 'Approve Maintenance', 'Maintenance'),
  ('safety.view', 'View Safety Inspections', 'Safety'),
  ('safety.create', 'Create Safety Inspections', 'Safety'),
  ('safety.edit', 'Edit Safety Inspections', 'Safety'),
  ('safety.delete', 'Delete Safety Inspections', 'Safety'),
  ('consumables.view', 'View Consumables', 'Consumables'),
  ('consumables.create', 'Create Consumables', 'Consumables'),
  ('consumables.edit', 'Edit Consumables', 'Consumables'),
  ('consumables.delete', 'Delete Consumables', 'Consumables'),
  ('activities.view', 'View Activities', 'Activities'),
  ('activities.create', 'Create Activities', 'Activities'),
  ('activities.edit', 'Edit Activities', 'Activities'),
  ('activities.delete', 'Delete Activities', 'Activities'),
  ('activities.verify', 'Verify Activities', 'Activities'),
  ('users.view', 'View Users', 'Users'),
  ('users.create', 'Create Users', 'Users'),
  ('users.edit', 'Edit Users', 'Users'),
  ('users.delete', 'Delete Users', 'Users'),
  ('users.reset_password', 'Reset Passwords', 'Users'),
  ('roles.view', 'View Roles', 'Roles'),
  ('roles.create', 'Create Roles', 'Roles'),
  ('roles.edit', 'Edit Roles', 'Roles'),
  ('roles.delete', 'Delete Roles', 'Roles'),
  ('colleges.view', 'View Colleges', 'Organization'),
  ('colleges.create', 'Create Colleges', 'Organization'),
  ('colleges.edit', 'Edit Colleges', 'Organization'),
  ('colleges.delete', 'Delete Colleges', 'Organization'),
  ('departments.view', 'View Departments', 'Organization'),
  ('departments.create', 'Create Departments', 'Organization'),
  ('departments.edit', 'Edit Departments', 'Organization'),
  ('departments.delete', 'Delete Departments', 'Organization'),
  ('labs.view', 'View Laboratories', 'Organization'),
  ('labs.create', 'Create Laboratories', 'Organization'),
  ('labs.edit', 'Edit Laboratories', 'Organization'),
  ('labs.delete', 'Delete Laboratories', 'Organization'),
  ('reports.view', 'View Reports', 'Reports'),
  ('reports.export', 'Export Reports', 'Reports'),
  ('settings.view', 'View Settings', 'Settings'),
  ('settings.edit', 'Edit Settings', 'Settings');

-- 6. Seed default roles
INSERT INTO custom_roles (name, description, is_system) VALUES
  ('Super Admin', 'Full system access with all permissions', true),
  ('AVD', 'College Vice Dean - college level oversight', true),
  ('Department Head', 'Department level management', true),
  ('ARA', 'Academic Resource Administrator', true),
  ('Instructor', 'Teaching staff', true),
  ('Student', 'Student access - view only', true),
  ('Management', 'View and track progress', true);

-- 7. Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p WHERE cr.name = 'Super Admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p WHERE cr.name = 'AVD' AND p.code IN (
  'dashboard.view','lab_sessions.view','equipment.view','maintenance.view','safety.view',
  'consumables.view','activities.view','users.view','users.create','users.edit',
  'reports.view','reports.export','departments.view','colleges.view','labs.view','roles.view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p
WHERE cr.name = 'Department Head' AND p.code IN (
  'dashboard.view','lab_sessions.view','lab_sessions.create','lab_sessions.edit',
  'equipment.view','equipment.create','equipment.edit',
  'maintenance.view','maintenance.create','maintenance.edit','maintenance.approve',
  'safety.view','safety.create','safety.edit',
  'consumables.view','consumables.create','consumables.edit',
  'activities.view','activities.verify',
  'users.view','users.create','users.edit',
  'reports.view','reports.export',
  'departments.view','colleges.view','labs.view','labs.create','labs.edit','roles.view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p
WHERE cr.name = 'ARA' AND p.code IN (
  'dashboard.view','lab_sessions.view','lab_sessions.create','lab_sessions.edit',
  'equipment.view','equipment.create','equipment.edit',
  'maintenance.view','maintenance.create','maintenance.edit',
  'safety.view','safety.create','safety.edit',
  'consumables.view','consumables.create','consumables.edit',
  'activities.view','activities.create','activities.edit',
  'reports.view','labs.view','departments.view','colleges.view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p
WHERE cr.name = 'Instructor' AND p.code IN (
  'dashboard.view','lab_sessions.view','lab_sessions.create','lab_sessions.edit',
  'equipment.view','consumables.view','safety.view','maintenance.view',
  'reports.view','labs.view','departments.view','colleges.view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p
WHERE cr.name = 'Student' AND p.code IN ('dashboard.view','lab_sessions.view','equipment.view','labs.view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM custom_roles cr CROSS JOIN permissions p
WHERE cr.name = 'Management' AND p.code IN (
  'dashboard.view','lab_sessions.view','equipment.view','maintenance.view',
  'safety.view','consumables.view','activities.view',
  'reports.view','reports.export','departments.view','colleges.view','labs.view');

-- 8. Migrate existing users from user_roles to user_role_assignments
INSERT INTO user_role_assignments (user_id, role_id, scope, scope_id)
SELECT ur.user_id, cr.id,
  CASE
    WHEN ur.role IN ('admin') THEN 'all'
    WHEN ur.role = 'avd' THEN 'college'
    WHEN ur.role = 'management' THEN 'all'
    ELSE 'department'
  END,
  CASE
    WHEN ur.role = 'avd' THEN (SELECT d.college_id FROM profiles p JOIN departments d ON d.id = p.department_id WHERE p.id = ur.user_id)
    WHEN ur.role IN ('department_head','ara','instructor','student','technician','supervisor') THEN (SELECT department_id FROM profiles WHERE id = ur.user_id)
    ELSE NULL
  END
FROM user_roles ur
JOIN custom_roles cr ON cr.name = CASE
  WHEN ur.role = 'admin' THEN 'Super Admin'
  WHEN ur.role = 'avd' THEN 'AVD'
  WHEN ur.role = 'department_head' THEN 'Department Head'
  WHEN ur.role = 'ara' THEN 'ARA'
  WHEN ur.role = 'instructor' THEN 'Instructor'
  WHEN ur.role = 'student' THEN 'Student'
  WHEN ur.role = 'management' THEN 'Management'
  WHEN ur.role = 'technician' THEN 'ARA'
  WHEN ur.role = 'supervisor' THEN 'Department Head'
END
ON CONFLICT (user_id) DO NOTHING;

-- 9. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_role_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  SELECT id INTO _student_role_id FROM public.custom_roles WHERE name = 'Student' LIMIT 1;
  IF _student_role_id IS NOT NULL THEN
    INSERT INTO public.user_role_assignments (user_id, role_id, scope)
    VALUES (NEW.id, _student_role_id, 'department')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 10. Update RLS policies for data tables to use permission-based checks

-- Lab Sessions
DROP POLICY IF EXISTS "Sessions viewable" ON public.lab_sessions;
DROP POLICY IF EXISTS "Insert sessions" ON public.lab_sessions;
DROP POLICY IF EXISTS "Update sessions" ON public.lab_sessions;
DROP POLICY IF EXISTS "Delete sessions" ON public.lab_sessions;

CREATE POLICY "View sessions" ON public.lab_sessions FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'lab_sessions.view') AND user_can_access_scope(auth.uid(), department_id));
CREATE POLICY "Create sessions" ON public.lab_sessions FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'lab_sessions.create'));
CREATE POLICY "Edit sessions" ON public.lab_sessions FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'lab_sessions.edit'));
CREATE POLICY "Remove sessions" ON public.lab_sessions FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'lab_sessions.delete'));

-- Equipment
DROP POLICY IF EXISTS "Equipment viewable" ON public.equipment;
DROP POLICY IF EXISTS "Manage equipment" ON public.equipment;

CREATE POLICY "View equipment" ON public.equipment FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'equipment.view') AND user_can_access_scope(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Create equipment" ON public.equipment FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'equipment.create'));
CREATE POLICY "Edit equipment" ON public.equipment FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'equipment.edit'));
CREATE POLICY "Remove equipment" ON public.equipment FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'equipment.delete'));

-- Maintenance
DROP POLICY IF EXISTS "Maintenance viewable" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Manage maintenance" ON public.maintenance_logs;

CREATE POLICY "View maintenance" ON public.maintenance_logs FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'maintenance.view') AND user_can_access_scope(auth.uid(), equipment_department(equipment_id)));
CREATE POLICY "Create maintenance" ON public.maintenance_logs FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'maintenance.create'));
CREATE POLICY "Edit maintenance" ON public.maintenance_logs FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'maintenance.edit'));
CREATE POLICY "Remove maintenance" ON public.maintenance_logs FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'maintenance.delete'));

-- Safety
DROP POLICY IF EXISTS "Inspections viewable" ON public.safety_inspections;
DROP POLICY IF EXISTS "Manage inspections" ON public.safety_inspections;

CREATE POLICY "View inspections" ON public.safety_inspections FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'safety.view') AND user_can_access_scope(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Create inspections" ON public.safety_inspections FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'safety.create'));
CREATE POLICY "Edit inspections" ON public.safety_inspections FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'safety.edit'));
CREATE POLICY "Remove inspections" ON public.safety_inspections FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'safety.delete'));

-- Consumables
DROP POLICY IF EXISTS "Consumables viewable" ON public.consumables;
DROP POLICY IF EXISTS "Manage consumables" ON public.consumables;

CREATE POLICY "View consumables" ON public.consumables FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'consumables.view') AND user_can_access_scope(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Create consumables" ON public.consumables FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'consumables.create'));
CREATE POLICY "Edit consumables" ON public.consumables FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'consumables.edit'));
CREATE POLICY "Remove consumables" ON public.consumables FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'consumables.delete'));

-- Activities
DROP POLICY IF EXISTS "Activities viewable" ON public.technician_activities;
DROP POLICY IF EXISTS "Insert own activities" ON public.technician_activities;
DROP POLICY IF EXISTS "Update activities" ON public.technician_activities;

CREATE POLICY "View activities" ON public.technician_activities FOR SELECT TO authenticated
  USING (user_has_permission(auth.uid(), 'activities.view') AND user_can_access_scope(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Create activities" ON public.technician_activities FOR INSERT TO authenticated
  WITH CHECK (user_has_permission(auth.uid(), 'activities.create'));
CREATE POLICY "Edit activities" ON public.technician_activities FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'activities.edit'));
CREATE POLICY "Remove activities" ON public.technician_activities FOR DELETE TO authenticated
  USING (user_has_permission(auth.uid(), 'activities.delete'));
