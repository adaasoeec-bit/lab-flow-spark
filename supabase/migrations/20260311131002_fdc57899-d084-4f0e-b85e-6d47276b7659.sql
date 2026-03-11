
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'technician', 'instructor', 'student');
CREATE TYPE public.equipment_status AS ENUM ('operational', 'under_maintenance', 'out_of_service', 'decommissioned');
CREATE TYPE public.maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.maintenance_type AS ENUM ('preventive', 'corrective', 'calibration', 'emergency');

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $$;

-- user_roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, abbreviation TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments viewable" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Laboratories
CREATE TABLE public.laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  location TEXT, capacity INT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Labs viewable" ON public.laboratories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage labs" ON public.laboratories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '', email TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  phone TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Lab Sessions
CREATE TABLE public.lab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL, activity_type TEXT NOT NULL DEFAULT 'practical',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  number_of_users INT NOT NULL DEFAULT 0, start_time TIME NOT NULL, end_time TIME,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  instructor_confirmed BOOLEAN NOT NULL DEFAULT false, remarks TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions viewable" ON public.lab_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert sessions" ON public.lab_sessions FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Update sessions" ON public.lab_sessions FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor') OR (public.has_role(auth.uid(), 'instructor') AND instructor_id = auth.uid()));

-- Equipment
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, category TEXT, model TEXT, serial_number TEXT UNIQUE,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE SET NULL,
  installation_date DATE, status equipment_status NOT NULL DEFAULT 'operational',
  last_calibration DATE, next_calibration DATE,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipment viewable" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage equipment" ON public.equipment FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'));

-- Maintenance Logs
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maintenance_type maintenance_type NOT NULL DEFAULT 'corrective',
  problem_reported TEXT, action_taken TEXT,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  supervisor_approved BOOLEAN NOT NULL DEFAULT false,
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status maintenance_status NOT NULL DEFAULT 'pending',
  remarks TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintenance viewable" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage maintenance" ON public.maintenance_logs FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'));

-- Safety Inspections
CREATE TABLE public.safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE SET NULL,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fire_safety BOOLEAN NOT NULL DEFAULT false, electrical_safety BOOLEAN NOT NULL DEFAULT false,
  ppe_status BOOLEAN NOT NULL DEFAULT false, emergency_exit BOOLEAN NOT NULL DEFAULT false,
  hazards_identified TEXT, corrective_action TEXT, follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.safety_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inspections viewable" ON public.safety_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage inspections" ON public.safety_inspections FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'));

-- Consumables
CREATE TABLE public.consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'pcs',
  quantity_received INT NOT NULL DEFAULT 0, quantity_issued INT NOT NULL DEFAULT 0,
  balance INT GENERATED ALWAYS AS (quantity_received - quantity_issued) STORED,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE SET NULL,
  issued_to TEXT, authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consumables viewable" ON public.consumables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage consumables" ON public.consumables FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'supervisor'));

-- Technician Activities
CREATE TABLE public.technician_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  technician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE SET NULL,
  activity_description TEXT NOT NULL, course_supported TEXT,
  start_time TIME NOT NULL, end_time TIME,
  supervisor_verified BOOLEAN NOT NULL DEFAULT false,
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.technician_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities viewable" ON public.technician_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own activities" ON public.technician_activities FOR INSERT TO authenticated WITH CHECK (
  technician_id = auth.uid() AND (public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Update activities" ON public.technician_activities FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR technician_id = auth.uid() OR public.has_role(auth.uid(), 'supervisor'));

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, table_name TEXT NOT NULL, record_id UUID,
  old_data JSONB, new_data JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data
INSERT INTO public.departments (name, abbreviation) VALUES
  ('Chemistry', 'CHEM'), ('Biology', 'BIO'), ('Physics', 'PHY'),
  ('Computer Science', 'CS'), ('Electrical Engineering', 'EE');

INSERT INTO public.laboratories (name, department_id) VALUES
  ('Chemistry Lab A', (SELECT id FROM public.departments WHERE abbreviation = 'CHEM')),
  ('Chemistry Lab B', (SELECT id FROM public.departments WHERE abbreviation = 'CHEM')),
  ('Biology Lab A', (SELECT id FROM public.departments WHERE abbreviation = 'BIO')),
  ('Biology Lab B', (SELECT id FROM public.departments WHERE abbreviation = 'BIO')),
  ('Physics Lab C', (SELECT id FROM public.departments WHERE abbreviation = 'PHY'));
