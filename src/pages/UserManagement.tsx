import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RotateCcw, Trash2, Pencil, Search } from "lucide-react";
import { useProfiles, useUserRoles, useDepartments } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const ALL_ROLES = [
  { value: "admin", label: "System Admin" },
  { value: "avd", label: "AVD" },
  { value: "department_head", label: "Department Head" },
  { value: "ara", label: "ARA" },
  { value: "supervisor", label: "Supervisor" },
  { value: "technician", label: "Technician" },
  { value: "instructor", label: "Instructor" },
  { value: "student", label: "Student" },
  { value: "management", label: "Management" },
];

const ROLE_BADGE: Record<string, { type: "info" | "success" | "warning" | "neutral"; label: string }> = {
  admin: { type: "info", label: "System Admin" },
  avd: { type: "info", label: "AVD" },
  department_head: { type: "warning", label: "Dept. Head" },
  ara: { type: "warning", label: "ARA" },
  supervisor: { type: "warning", label: "Supervisor" },
  technician: { type: "success", label: "Technician" },
  instructor: { type: "neutral", label: "Instructor" },
  student: { type: "neutral", label: "Student" },
  management: { type: "info", label: "Management" },
};

export default function UserManagement() {
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { data: roles, isLoading: loadingRoles } = useUserRoles();
  const { data: departments } = useDepartments();
  const { role: myRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", email: "", user_role: "student", department_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const roleByUser = new Map<string, string>();
  (roles ?? []).forEach((r: any) => roleByUser.set(r.user_id, r.role));

  const callManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    return res;
  };

  const handleCreate = async () => {
    if (!form.email || !form.full_name) return;
    setSubmitting(true);
    const { data, error } = await callManageUsers({
      action: "create_user",
      email: form.email,
      full_name: form.full_name,
      user_role: form.user_role,
      department_id: form.department_id || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "User created", description: `${form.email} — default password: 12345678` });
      setCreateOpen(false);
      setForm({ full_name: "", email: "", user_role: "student", department_id: "" });
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const { error } = await callManageUsers({ action: "delete_user", user_id: userId });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "User deleted" });
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Reset this user's password to 12345678?")) return;
    const { error } = await callManageUsers({ action: "reset_password", user_id: userId, new_password: "12345678" });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "Password reset", description: "New password: 12345678" });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    const { error } = await callManageUsers({
      action: "update_role",
      user_id: selectedUser.id,
      new_role: form.user_role,
    });
    if (!error) {
      await callManageUsers({
        action: "update_user",
        user_id: selectedUser.id,
        full_name: form.full_name,
        department_id: form.department_id || null,
      });
    }
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "User updated" });
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    }
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      user_role: roleByUser.get(user.id) ?? "student",
      department_id: user.department_id || "",
    });
    setEditOpen(true);
  };

  const filtered = (profiles ?? []).filter((u: any) => {
    const q = search.toLowerCase();
    return !q || (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
  });

  const isAdmin = myRole === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage system users and roles</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.user_role} onValueChange={(v) => setForm({ ...form, user_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {(departments ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Default password: <span className="font-mono">12345678</span>. User will be prompted to change on first login.</p>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Creating…" : "Create User"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(loadingProfiles || loadingRoles) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {filtered.map((u: any) => {
              const r = roleByUser.get(u.id) ?? "student";
              const badge = ROLE_BADGE[r] ?? { type: "neutral" as const, label: r };
              return (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{u.email ?? "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={badge.type} label={badge.label} /></td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u.id)} title="Reset Password">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} title="Delete" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loadingProfiles && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.user_role} onValueChange={(v) => setForm({ ...form, user_role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {(departments ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateRole} disabled={submitting}>{submitting ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
