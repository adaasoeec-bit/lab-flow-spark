import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const mockUsers = [
  { id: "U-001", name: "Admin User", email: "admin@astu.edu.et", role: "admin", status: "active", lastLogin: "2026-03-10" },
  { id: "U-002", name: "Ato Kebede", email: "kebede@astu.edu.et", role: "technician", status: "active", lastLogin: "2026-03-10" },
  { id: "U-003", name: "Dr. Abebe", email: "abebe@astu.edu.et", role: "instructor", status: "active", lastLogin: "2026-03-09" },
  { id: "U-004", name: "Ato Dawit", email: "dawit@astu.edu.et", role: "technician", status: "active", lastLogin: "2026-03-10" },
  { id: "U-005", name: "Dr. Tigist", email: "tigist@astu.edu.et", role: "supervisor", status: "active", lastLogin: "2026-03-08" },
];

const roleMap: Record<string, { type: "info" | "success" | "warning" | "neutral"; label: string }> = {
  admin: { type: "info", label: "Administrator" },
  supervisor: { type: "warning", label: "Supervisor" },
  technician: { type: "success", label: "Technician" },
  instructor: { type: "neutral", label: "Instructor" },
  student: { type: "neutral", label: "Student" },
};

export default function UserManagement() {
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
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockUsers.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-2"><StatusBadge status={roleMap[u.role].type} label={roleMap[u.role].label} /></td>
                <td className="px-4 py-2"><StatusBadge status="success" label="Active" /></td>
                <td className="px-4 py-2 font-mono text-xs">{u.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
