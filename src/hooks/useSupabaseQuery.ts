import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLaboratories() {
  return useQuery({
    queryKey: ["laboratories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laboratories")
        .select("*, departments(name, abbreviation)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useLabSessions() {
  return useQuery({
    queryKey: ["lab_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_sessions")
        .select("*, laboratories(name), departments(name)")
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useEquipment() {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*, laboratories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMaintenanceLogs() {
  return useQuery({
    queryKey: ["maintenance_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*, equipment(name)")
        .order("maintenance_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSafetyInspections() {
  return useQuery({
    queryKey: ["safety_inspections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_inspections")
        .select("*, laboratories(name)")
        .order("inspection_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useConsumables() {
  return useQuery({
    queryKey: ["consumables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumables")
        .select("*, laboratories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useTechnicianActivities() {
  return useQuery({
    queryKey: ["technician_activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technician_activities")
        .select("*, laboratories(name)")
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });
}
