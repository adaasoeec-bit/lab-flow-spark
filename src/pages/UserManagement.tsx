import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProfiles, useUserRoles } from "@/hooks/useSupabaseQuery";

const roleMap: Record<string, { type: "info" | "success" | "warning" | "neutral"; label: string }> = {
  admin: { type: "info", label: "Administrator" },
  supervisor: { type: "warning", label: "Supervisor" },
  technician: { type: "success", label: "Technician" },
  instructor: { type: "neutral", label: "Instructor" },
  student: { type: "neutral", label: "Student" },
};

export default function UserManagement() {
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { data: roles, isLoading: loadingRoles } = useUserRoles();

  const roleByUser = new Map<string, string>();
  (roles ?? []).forEach(r => roleByUser.set(r.user_id, r.role));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage system users and roles</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(loadingProfiles || loadingRoles) && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {(profiles ?? []).map((u) => {
              const r = roleByUser.get(u.id) ?? "student";
              const rm = roleMap[r] ?? { type: "neutral" as const, label: r };
              return (
                <tr key={u.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-2 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{u.email ?? "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={rm.type} label={rm.label} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loadingProfiles && (profiles ?? []).length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</div>}
      </div>
    </div>
  );
}
