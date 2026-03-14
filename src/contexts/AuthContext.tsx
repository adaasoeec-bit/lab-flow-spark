import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url?: string | null;
  department_id: string | null;
  password_change_required?: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: string | null;
  permissions: string[];
  scope: { type: string; id: string | null } | null;
  loading: boolean;
  passwordChangeRequired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [scope, setScope] = useState<{ type: string; id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  const fetchProfileAndRole = async (userId: string) => {
    const [profileRes, roleInfoRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.rpc("get_user_role_info" as any, { _user_id: userId }),
      supabase.rpc("get_user_permissions" as any, { _user_id: userId }),
    ]);

    if (profileRes.data) {
      const p = profileRes.data as any;
      setProfile(p as Profile);
      setPasswordChangeRequired(p.password_change_required ?? false);
    }

    const roleData = roleInfoRes.data as any;
    if (roleData && Array.isArray(roleData) && roleData.length > 0) {
      setRole(roleData[0].role_name);
      setScope({ type: roleData[0].role_scope, id: roleData[0].role_scope_id });
    } else if (roleData && roleData.role_name) {
      setRole(roleData.role_name);
      setScope({ type: roleData.role_scope, id: roleData.role_scope_id });
    } else {
      // Fallback to old system
      const { data: oldRole } = await supabase.rpc("get_user_role", { _user_id: userId });
      if (oldRole) setRole(oldRole === "admin" ? "Super Admin" : String(oldRole));
    }

    const permsData = permsRes.data as any;
    if (Array.isArray(permsData)) {
      setPermissions(permsData.map((p: any) => p.permission_code ?? p));
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndRole(user.id);
  };

  const hasPermission = useCallback(
    (code: string) => permissions.includes(code),
    [permissions]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfileAndRole(session.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
        setPermissions([]);
        setScope(null);
        setPasswordChangeRequired(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setPermissions([]);
    setScope(null);
    setPasswordChangeRequired(false);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, role, permissions, scope, loading, passwordChangeRequired, signIn, signOut, refreshProfile, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
