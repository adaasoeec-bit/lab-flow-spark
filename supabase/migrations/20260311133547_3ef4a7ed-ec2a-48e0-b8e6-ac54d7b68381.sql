
-- Colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Departments: add college reference
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='college_id') THEN
    ALTER TABLE public.departments ADD COLUMN college_id uuid REFERENCES public.colleges(id);
  END IF;
END $$;

-- Profiles: add avatar + force-change flag
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='password_change_required') THEN
    ALTER TABLE public.profiles ADD COLUMN password_change_required boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.user_department_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT department_id FROM profiles WHERE id = _user_id $$;

CREATE OR REPLACE FUNCTION public.user_college_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT d.college_id FROM profiles p JOIN departments d ON d.id = p.department_id WHERE p.id = _user_id $$;

CREATE OR REPLACE FUNCTION public.lab_department(_lab_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT department_id FROM laboratories WHERE id = _lab_id $$;

CREATE OR REPLACE FUNCTION public.equipment_department(_equip_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT l.department_id FROM equipment e JOIN laboratories l ON l.id = e.laboratory_id WHERE e.id = _equip_id $$;

CREATE OR REPLACE FUNCTION public.can_view_data(_user_id uuid, _dept_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _dept_id IS NULL
    OR has_role(_user_id, 'admin'::app_role)
    OR has_role(_user_id, 'management'::app_role)
    OR user_department_id(_user_id) = _dept_id
    OR (has_role(_user_id, 'avd'::app_role) AND EXISTS (
         SELECT 1 FROM departments d WHERE d.id = _dept_id AND d.college_id IS NOT NULL AND d.college_id = user_college_id(_user_id)
       ))
$$;

CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE profiles SET password_change_required = false WHERE id = auth.uid(); END; $$;

-- RLS policies
DROP POLICY IF EXISTS "Colleges viewable" ON public.colleges;
DROP POLICY IF EXISTS "Admins manage colleges" ON public.colleges;
CREATE POLICY "Colleges viewable" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage colleges" ON public.colleges FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Departments viewable" ON public.departments;
DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
CREATE POLICY "Departments viewable" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "View all profiles" ON public.profiles;
DROP POLICY IF EXISTS "View profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "View profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'management'::app_role)
    OR (user_department_id(auth.uid()) IS NOT NULL AND department_id = user_department_id(auth.uid()))
    OR (has_role(auth.uid(), 'avd'::app_role) AND department_id IN (SELECT d.id FROM departments d WHERE d.college_id = user_college_id(auth.uid())))
  );
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "View roles" ON public.user_roles;
CREATE POLICY "Manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'avd'::app_role) OR has_role(auth.uid(), 'department_head'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'avd'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));
CREATE POLICY "View roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'avd'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));

DROP POLICY IF EXISTS "Sessions viewable" ON public.lab_sessions;
DROP POLICY IF EXISTS "Insert sessions" ON public.lab_sessions;
DROP POLICY IF EXISTS "Update sessions" ON public.lab_sessions;
DROP POLICY IF EXISTS "Delete sessions" ON public.lab_sessions;
CREATE POLICY "Sessions viewable" ON public.lab_sessions FOR SELECT TO authenticated USING (can_view_data(auth.uid(), department_id));
CREATE POLICY "Insert sessions" ON public.lab_sessions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role) OR has_role(auth.uid(), 'instructor'::app_role));
CREATE POLICY "Update sessions" ON public.lab_sessions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role) OR (has_role(auth.uid(), 'instructor'::app_role) AND instructor_id = auth.uid()));
CREATE POLICY "Delete sessions" ON public.lab_sessions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Equipment viewable" ON public.equipment;
DROP POLICY IF EXISTS "Manage equipment" ON public.equipment;
CREATE POLICY "Equipment viewable" ON public.equipment FOR SELECT TO authenticated USING (can_view_data(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Manage equipment" ON public.equipment FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));

DROP POLICY IF EXISTS "Maintenance viewable" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Manage maintenance" ON public.maintenance_logs;
CREATE POLICY "Maintenance viewable" ON public.maintenance_logs FOR SELECT TO authenticated USING (can_view_data(auth.uid(), equipment_department(equipment_id)));
CREATE POLICY "Manage maintenance" ON public.maintenance_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));

DROP POLICY IF EXISTS "Inspections viewable" ON public.safety_inspections;
DROP POLICY IF EXISTS "Manage inspections" ON public.safety_inspections;
CREATE POLICY "Inspections viewable" ON public.safety_inspections FOR SELECT TO authenticated USING (can_view_data(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Manage inspections" ON public.safety_inspections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));

DROP POLICY IF EXISTS "Consumables viewable" ON public.consumables;
DROP POLICY IF EXISTS "Manage consumables" ON public.consumables;
CREATE POLICY "Consumables viewable" ON public.consumables FOR SELECT TO authenticated USING (can_view_data(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Manage consumables" ON public.consumables FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));

DROP POLICY IF EXISTS "Activities viewable" ON public.technician_activities;
DROP POLICY IF EXISTS "Insert own activities" ON public.technician_activities;
DROP POLICY IF EXISTS "Update activities" ON public.technician_activities;
CREATE POLICY "Activities viewable" ON public.technician_activities FOR SELECT TO authenticated USING (can_view_data(auth.uid(), lab_department(laboratory_id)));
CREATE POLICY "Insert own activities" ON public.technician_activities FOR INSERT TO authenticated
  WITH CHECK (technician_id = auth.uid() AND (has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Update activities" ON public.technician_activities FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR technician_id = auth.uid() OR has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));

DROP POLICY IF EXISTS "Admins view audit" ON public.audit_logs;
DROP POLICY IF EXISTS "Insert audit" ON public.audit_logs;
CREATE POLICY "Admins view audit" ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Labs viewable" ON public.laboratories;
DROP POLICY IF EXISTS "Admins manage labs" ON public.laboratories;
DROP POLICY IF EXISTS "Manage labs" ON public.laboratories;
CREATE POLICY "Labs viewable" ON public.laboratories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage labs" ON public.laboratories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'department_head'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'department_head'::app_role));
