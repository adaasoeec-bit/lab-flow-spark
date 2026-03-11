export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      consumables: {
        Row: {
          authorized_by: string | null
          balance: number | null
          created_at: string
          id: string
          issued_to: string | null
          laboratory_id: string | null
          last_updated: string
          name: string
          quantity_issued: number
          quantity_received: number
          technician_id: string | null
          unit: string
        }
        Insert: {
          authorized_by?: string | null
          balance?: number | null
          created_at?: string
          id?: string
          issued_to?: string | null
          laboratory_id?: string | null
          last_updated?: string
          name: string
          quantity_issued?: number
          quantity_received?: number
          technician_id?: string | null
          unit?: string
        }
        Update: {
          authorized_by?: string | null
          balance?: number | null
          created_at?: string
          id?: string
          issued_to?: string | null
          laboratory_id?: string | null
          last_updated?: string
          name?: string
          quantity_issued?: number
          quantity_received?: number
          technician_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumables_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          abbreviation: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          category: string | null
          created_at: string
          id: string
          installation_date: string | null
          laboratory_id: string | null
          last_calibration: string | null
          model: string | null
          name: string
          next_calibration: string | null
          remarks: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          technician_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          installation_date?: string | null
          laboratory_id?: string | null
          last_calibration?: string | null
          model?: string | null
          name: string
          next_calibration?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          technician_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          installation_date?: string | null
          laboratory_id?: string | null
          last_calibration?: string | null
          model?: string | null
          name?: string
          next_calibration?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_sessions: {
        Row: {
          activity_type: string
          course_name: string
          created_at: string
          created_by: string | null
          date: string
          department_id: string | null
          end_time: string | null
          id: string
          instructor_confirmed: boolean
          instructor_id: string | null
          laboratory_id: string | null
          number_of_users: number
          remarks: string | null
          start_time: string
          technician_id: string | null
        }
        Insert: {
          activity_type?: string
          course_name: string
          created_at?: string
          created_by?: string | null
          date?: string
          department_id?: string | null
          end_time?: string | null
          id?: string
          instructor_confirmed?: boolean
          instructor_id?: string | null
          laboratory_id?: string | null
          number_of_users?: number
          remarks?: string | null
          start_time: string
          technician_id?: string | null
        }
        Update: {
          activity_type?: string
          course_name?: string
          created_at?: string
          created_by?: string | null
          date?: string
          department_id?: string | null
          end_time?: string | null
          id?: string
          instructor_confirmed?: boolean
          instructor_id?: string | null
          laboratory_id?: string | null
          number_of_users?: number
          remarks?: string | null
          start_time?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_sessions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_sessions_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratories: {
        Row: {
          capacity: number | null
          created_at: string
          department_id: string | null
          id: string
          location: string | null
          name: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          department_id?: string | null
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          department_id?: string | null
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratories_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          action_taken: string | null
          created_at: string
          equipment_id: string
          id: string
          maintenance_date: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          problem_reported: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          supervisor_approved: boolean
          supervisor_id: string | null
          technician_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          equipment_id: string
          id?: string
          maintenance_date?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          problem_reported?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          supervisor_approved?: boolean
          supervisor_id?: string | null
          technician_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          equipment_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          problem_reported?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          supervisor_approved?: boolean
          supervisor_id?: string | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_inspections: {
        Row: {
          corrective_action: string | null
          created_at: string
          electrical_safety: boolean
          emergency_exit: boolean
          fire_safety: boolean
          follow_up_date: string | null
          hazards_identified: string | null
          id: string
          inspection_date: string
          inspector_id: string | null
          laboratory_id: string | null
          ppe_status: boolean
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          electrical_safety?: boolean
          emergency_exit?: boolean
          fire_safety?: boolean
          follow_up_date?: string | null
          hazards_identified?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          laboratory_id?: string | null
          ppe_status?: boolean
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          electrical_safety?: boolean
          emergency_exit?: boolean
          fire_safety?: boolean
          follow_up_date?: string | null
          hazards_identified?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          laboratory_id?: string | null
          ppe_status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "safety_inspections_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_activities: {
        Row: {
          activity_description: string
          course_supported: string | null
          created_at: string
          date: string
          end_time: string | null
          id: string
          laboratory_id: string | null
          start_time: string
          supervisor_id: string | null
          supervisor_verified: boolean
          technician_id: string
        }
        Insert: {
          activity_description: string
          course_supported?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          laboratory_id?: string | null
          start_time: string
          supervisor_id?: string | null
          supervisor_verified?: boolean
          technician_id: string
        }
        Update: {
          activity_description?: string
          course_supported?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          laboratory_id?: string | null
          start_time?: string
          supervisor_id?: string | null
          supervisor_verified?: boolean
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_activities_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "technician" | "instructor" | "student"
      equipment_status:
        | "operational"
        | "under_maintenance"
        | "out_of_service"
        | "decommissioned"
      maintenance_status: "pending" | "in_progress" | "completed" | "cancelled"
      maintenance_type:
        | "preventive"
        | "corrective"
        | "calibration"
        | "emergency"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "technician", "instructor", "student"],
      equipment_status: [
        "operational",
        "under_maintenance",
        "out_of_service",
        "decommissioned",
      ],
      maintenance_status: ["pending", "in_progress", "completed", "cancelled"],
      maintenance_type: [
        "preventive",
        "corrective",
        "calibration",
        "emergency",
      ],
    },
  },
} as const
