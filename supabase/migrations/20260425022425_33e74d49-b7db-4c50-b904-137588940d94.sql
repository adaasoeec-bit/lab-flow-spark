-- Approval workflow: add status + submitted_at + approved_at + approved_by columns
-- across all ARA-created modules. 'draft' = ARA is editing, 'submitted' = waiting for
-- Department Head, 'approved'/'rejected' = final.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'lab_sessions','technician_activities','maintenance_logs',
    'safety_inspections','equipment','consumables'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT ''draft'',
      ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
      ADD COLUMN IF NOT EXISTS approved_at timestamptz,
      ADD COLUMN IF NOT EXISTS approved_by uuid,
      ADD COLUMN IF NOT EXISTS rejection_reason text,
      ADD COLUMN IF NOT EXISTS created_by uuid', t);
  END LOOP;
END $$;

-- Constrain approval_status values via trigger (CHECK kept simple/portable)
ALTER TABLE public.lab_sessions DROP CONSTRAINT IF EXISTS lab_sessions_approval_status_chk;
ALTER TABLE public.lab_sessions ADD CONSTRAINT lab_sessions_approval_status_chk
  CHECK (approval_status IN ('draft','submitted','approved','rejected'));
ALTER TABLE public.technician_activities ADD CONSTRAINT technician_activities_approval_status_chk
  CHECK (approval_status IN ('draft','submitted','approved','rejected'));
ALTER TABLE public.maintenance_logs ADD CONSTRAINT maintenance_logs_approval_status_chk
  CHECK (approval_status IN ('draft','submitted','approved','rejected'));
ALTER TABLE public.safety_inspections ADD CONSTRAINT safety_inspections_approval_status_chk
  CHECK (approval_status IN ('draft','submitted','approved','rejected'));
ALTER TABLE public.equipment ADD CONSTRAINT equipment_approval_status_chk
  CHECK (approval_status IN ('draft','submitted','approved','rejected'));
ALTER TABLE public.consumables ADD CONSTRAINT consumables_approval_status_chk
  CHECK (approval_status IN ('draft','submitted','approved','rejected'));

-- Helper: is the current user an ARA?
CREATE OR REPLACE FUNCTION public.user_is_ara(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN custom_roles cr ON cr.id = ura.role_id
    WHERE ura.user_id = _user_id AND lower(cr.name) = 'ara'
  ) OR has_role(_user_id, 'ara'::app_role)
$$;

-- Helper: is the current user a Department Head (approver)?
CREATE OR REPLACE FUNCTION public.user_is_dept_head(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN custom_roles cr ON cr.id = ura.role_id
    WHERE ura.user_id = _user_id AND lower(cr.name) IN ('department head','department_head','deputy head','deputy_head')
  ) OR has_role(_user_id, 'department_head'::app_role)
$$;

-- =========================================================================
-- Replace SELECT policies so ARAs only see their own records, while
-- Department Heads / Admins / Management see everything in their scope.
-- =========================================================================

-- LAB SESSIONS
DROP POLICY IF EXISTS "View sessions" ON public.lab_sessions;
CREATE POLICY "View sessions" ON public.lab_sessions FOR SELECT TO authenticated
USING (
  user_has_permission(auth.uid(), 'lab_sessions.view')
  AND user_can_access_scope(auth.uid(), department_id)
  AND (
    NOT user_is_ara(auth.uid())
    OR created_by = auth.uid()
    OR technician_id = auth.uid()
  )
);

-- TECHNICIAN ACTIVITIES
DROP POLICY IF EXISTS "View activities" ON public.technician_activities;
CREATE POLICY "View activities" ON public.technician_activities FOR SELECT TO authenticated
USING (
  user_has_permission(auth.uid(), 'activities.view')
  AND user_can_access_scope(auth.uid(), lab_department(laboratory_id))
  AND (
    NOT user_is_ara(auth.uid())
    OR technician_id = auth.uid()
    OR created_by = auth.uid()
  )
);

-- MAINTENANCE LOGS
DROP POLICY IF EXISTS "View maintenance" ON public.maintenance_logs;
CREATE POLICY "View maintenance" ON public.maintenance_logs FOR SELECT TO authenticated
USING (
  user_has_permission(auth.uid(), 'maintenance.view')
  AND user_can_access_scope(auth.uid(), equipment_department(equipment_id))
  AND (
    NOT user_is_ara(auth.uid())
    OR created_by = auth.uid()
    OR technician_id = auth.uid()
  )
);

-- SAFETY INSPECTIONS
DROP POLICY IF EXISTS "View inspections" ON public.safety_inspections;
CREATE POLICY "View inspections" ON public.safety_inspections FOR SELECT TO authenticated
USING (
  user_has_permission(auth.uid(), 'safety.view')
  AND user_can_access_scope(auth.uid(), lab_department(laboratory_id))
  AND (
    NOT user_is_ara(auth.uid())
    OR created_by = auth.uid()
    OR inspector_id = auth.uid()
  )
);

-- EQUIPMENT
DROP POLICY IF EXISTS "View equipment" ON public.equipment;
CREATE POLICY "View equipment" ON public.equipment FOR SELECT TO authenticated
USING (
  user_has_permission(auth.uid(), 'equipment.view')
  AND user_can_access_scope(auth.uid(), lab_department(laboratory_id))
  AND (
    NOT user_is_ara(auth.uid())
    OR created_by = auth.uid()
    OR approval_status = 'approved'
  )
);

-- CONSUMABLES
DROP POLICY IF EXISTS "View consumables" ON public.consumables;
CREATE POLICY "View consumables" ON public.consumables FOR SELECT TO authenticated
USING (
  user_has_permission(auth.uid(), 'consumables.view')
  AND user_can_access_scope(auth.uid(), lab_department(laboratory_id))
  AND (
    NOT user_is_ara(auth.uid())
    OR created_by = auth.uid()
    OR approval_status = 'approved'
  )
);

-- =========================================================================
-- Approval permissions
-- =========================================================================
INSERT INTO public.permissions (code, name, category, description) VALUES
  ('lab_sessions.approve','Approve Lab Sessions','Approvals','Approve submitted lab sessions'),
  ('activities.approve','Approve Activities','Approvals','Approve submitted technician activities'),
  ('maintenance.approve','Approve Maintenance','Approvals','Approve submitted maintenance logs'),
  ('safety.approve','Approve Safety','Approvals','Approve submitted safety inspections'),
  ('equipment.approve','Approve Equipment','Approvals','Approve submitted equipment records'),
  ('consumables.approve','Approve Consumables','Approvals','Approve submitted consumable records')
ON CONFLICT (code) DO NOTHING;

-- Grant approval perms to Department Head custom role (if exists) and Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id FROM public.custom_roles cr CROSS JOIN public.permissions p
WHERE lower(cr.name) IN ('department head','department_head','deputy head','admin')
  AND p.code IN (
    'lab_sessions.approve','activities.approve','maintenance.approve',
    'safety.approve','equipment.approve','consumables.approve'
  )
ON CONFLICT DO NOTHING;