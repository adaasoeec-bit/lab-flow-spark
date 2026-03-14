import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RotateCcw, Trash2, Pencil, Search } from "lucide-react";
import { useProfiles, useDepartments, useCustomRoles, useUserRoleAssignments, useColleges } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function UserManagement() {
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { data: assignments, isLoading: loadingAssignments } = useUserRoleAssignments();
  const { data: departments } = useDepartments();
  const { data: colleges } = useColleges();
  const { data: customRoles } = useCustomRoles();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", email: "", role_id: "", department_id: "", scope: "department", scope_id: "" });
  const [submitting, setSubmitting] = useState(false);

  // Map user_id → assignment info
  const assignmentByUser = new Map<string, any>();
  (assignments ?? []).forEach((a: any) => assignmentByUser.set(a.user_id, a));

  // Map role_id → role name
  const roleNameById = new Map<string, string>();
  (customRoles ?? []).forEach((r: any) => roleNameById.set(r.id, r.name));

  const callManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    return res;
  };

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["profiles"] });
    qc.invalidateQueries({ queryKey: ["user_role_assignments"] });
    qc.invalidateQueries({ queryKey: ["user_roles"] });
  };

  const handleCreate = async () => {
    if (!form.email || !form.full_name || !form.role_id) return;
    setSubmitting(true);
    const { data, error } = await callManageUsers({
      action: "create_user",
      email: form.email,
      full_name: form.full_name,
      role_id: form.role_id,
      department_id: form.department_id || null,
      scope: form.scope,
      scope_id: form.scope_id || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "User created", description: `${form.email} — default password: 12345678` });
      setCreateOpen(false);
      setForm({ full_name: "", email: "", role_id: "", department_id: "", scope: "department", scope_id: "" });
      invalidateAll();
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const { error } = await callManageUsers({ action: "delete_user", user_id: userId });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "User deleted" });
      invalidateAll();
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

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    const { error } = await callManageUsers({
      action: "update_user_full",
      user_id: selectedUser.id,
      full_name: form.full_name,
      department_id: form.department_id || null,
      role_id: form.role_id,
      scope: form.scope,
      scope_id: form.scope_id || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    } else {
      toast({ title: "User updated" });
      setEditOpen(false);
      invalidateAll();
    }
  };

  const openEdit = (user: any) => {
    const assignment = assignmentByUser.get(user.id);
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      role_id: assignment?.role_id || "",
      department_id: user.department_id || "",
      scope: assignment?.scope || "department",
      scope_id: assignment?.scope_id || "",
    });
    setEditOpen(true);
  };

  const filtered = (profiles ?? []).filter((u: any) => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const scopeOptions = [
    { value: "all", label: "All (System-wide)" },
    { value: "college", label: "College" },
    { value: "department", label: "Department" },
  ];

  const renderScopeSelector = () => (
    <>
      <div className="space-y-2">
        <Label>Data Scope</Label>
        <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v, scope_id: "" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {scopeOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {form.scope === "college" && (
        <div className="space-y-2">
          <Label>College</Label>
          <Select value={form.scope_id} onValueChange={(v) => setForm({ ...form, scope_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
            <SelectContent>
              {(colleges ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {form.scope === "department" && (
        <div className="space-y-2">
          <Label>Scope Department</Label>
          <Select value={form.scope_id} onValueChange={(v) => setForm({ ...form, scope_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {(departments ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, assign roles and data scope</p>
        </div>
        {hasPermission("users.create") && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
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
                  <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {(customRoles ?? []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
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
                {renderScopeSelector()}
                <p className="text-xs text-muted-foreground">Default password: <span className="font-mono">12345678</span>. User will be prompted to change on first login.</p>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Creating…" : "Create User"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Scope</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(loadingProfiles || loadingAssignments) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {filtered.map((u: any) => {
              const assignment = assignmentByUser.get(u.id);
              const roleName = assignment ? roleNameById.get(assignment.role_id) ?? "—" : "—";
              const scopeLabel = assignment?.scope === "all" ? "System-wide" : assignment?.scope === "college" ? "College" : assignment?.scope === "department" ? "Department" : "—";
              return (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{u.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status="info" label={roleName} />
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{scopeLabel}</td>
                  <td className="px-4 py-2 text-right space-x-1">
                    {hasPermission("users.edit") && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission("users.reset_password") && (
                      <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u.id)} title="Reset Password">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission("users.delete") && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {(customRoles ?? []).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
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
            {renderScopeSelector()}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={submitting}>{submitting ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
