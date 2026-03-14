import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomRoles, usePermissions, useRolePermissions } from "@/hooks/useSupabaseQuery";

export default function RoleManagement() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: roles, isLoading: loadingRoles } = useCustomRoles();
  const { data: allPermissions } = usePermissions();
  const { data: rolePerms } = useRolePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const canCreate = hasPermission("roles.create");
  const canEdit = hasPermission("roles.edit");
  const canDelete = hasPermission("roles.delete");

  // Group permissions by category
  const permsByCategory = (allPermissions ?? []).reduce((acc: Record<string, any[]>, p: any) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: "", description: "" });
    setSelectedPerms(new Set());
    setDialogOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description || "" });
    // Load existing permissions for this role
    const permsForRole = (rolePerms ?? [])
      .filter((rp: any) => rp.role_id === role.id)
      .map((rp: any) => rp.permission_id);
    setSelectedPerms(new Set(permsForRole));
    setDialogOpen(true);
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    const catPermIds = permsByCategory[category]?.map((p: any) => p.id) ?? [];
    const allSelected = catPermIds.every((id: string) => selectedPerms.has(id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      catPermIds.forEach((id: string) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);

    try {
      let roleId: string;

      if (editingRole) {
        // Update role
        const { error } = await (supabase.from("custom_roles" as any) as any)
          .update({ name: form.name, description: form.description })
          .eq("id", editingRole.id);
        if (error) throw error;
        roleId = editingRole.id;

        // Delete existing permissions
        await (supabase.from("role_permissions" as any) as any).delete().eq("role_id", roleId);
      } else {
        // Create role
        const { data, error } = await (supabase.from("custom_roles" as any) as any)
          .insert({ name: form.name, description: form.description })
          .select("id")
          .single();
        if (error) throw error;
        roleId = data.id;
      }

      // Insert permissions
      if (selectedPerms.size > 0) {
        const rows = Array.from(selectedPerms).map((pid) => ({
          role_id: roleId,
          permission_id: pid,
        }));
        const { error } = await (supabase.from("role_permissions" as any) as any).insert(rows);
        if (error) throw error;
      }

      toast({ title: editingRole ? "Role updated" : "Role created" });
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["custom_roles"] });
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: any) => {
    if (role.is_system) {
      toast({ variant: "destructive", title: "Cannot delete system role" });
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    const { error } = await (supabase.from("custom_roles" as any) as any).delete().eq("id", role.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Role deleted" });
      qc.invalidateQueries({ queryKey: ["custom_roles"] });
    }
  };

  const getPermCount = (roleId: string) =>
    (rolePerms ?? []).filter((rp: any) => rp.role_id === roleId).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Role & Permission Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create roles and assign granular permissions</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loadingRoles && <p className="text-muted-foreground col-span-full text-center py-8">Loading…</p>}
        {(roles ?? []).map((role: any) => (
          <div key={role.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{role.name}</span>
                {role.is_system && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">System</span>
                )}
              </div>
              <div className="flex gap-1">
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {canDelete && !role.is_system && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(role)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
            <p className="text-xs text-muted-foreground">
              {getPermCount(role.id)} permission{getPermCount(role.id) !== 1 ? "s" : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lab Technician" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Permissions</Label>
              <div className="mt-2 space-y-3">
                {Object.entries(permsByCategory).map(([category, perms]) => {
                  const catPermIds = (perms as any[]).map((p) => p.id);
                  const allChecked = catPermIds.every((id) => selectedPerms.has(id));
                  const someChecked = catPermIds.some((id) => selectedPerms.has(id));

                  return (
                    <div key={category} className="rounded-md border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={allChecked}
                          ref={undefined}
                          onCheckedChange={() => toggleCategory(category)}
                          className={someChecked && !allChecked ? "opacity-60" : ""}
                        />
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-6">
                        {(perms as any[]).map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox
                              checked={selectedPerms.has(p.id)}
                              onCheckedChange={() => togglePerm(p.id)}
                            />
                            <span>{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving…" : editingRole ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
