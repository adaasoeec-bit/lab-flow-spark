import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

type ModuleKey =
  | "lab_sessions"
  | "technician_activities"
  | "maintenance_logs"
  | "safety_inspections"
  | "equipment"
  | "consumables";

const MODULES: { key: ModuleKey; label: string; titleField: string; permission: string; select: string }[] = [
  { key: "lab_sessions", label: "Logbook", titleField: "course_name", permission: "lab_sessions.approve", select: "*, laboratories(name)" },
  { key: "technician_activities", label: "Activities", titleField: "activity_description", permission: "activities.approve", select: "*, laboratories(name)" },
  { key: "maintenance_logs", label: "Maintenance", titleField: "problem_reported", permission: "maintenance.approve", select: "*, equipment(name)" },
  { key: "safety_inspections", label: "Safety", titleField: "hazards_identified", permission: "safety.approve", select: "*, laboratories(name)" },
  { key: "equipment", label: "Equipment", titleField: "name", permission: "equipment.approve", select: "*, laboratories(name)" },
  { key: "consumables", label: "Consumables", titleField: "name", permission: "consumables.approve", select: "*, laboratories(name)" },
];

function useSubmitted(key: ModuleKey, select: string) {
  return useQuery({
    queryKey: ["approvals", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(key as any)
        .select(select)
        .eq("approval_status", "submitted")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function ModulePanel({ mod }: { mod: (typeof MODULES)[number] }) {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useSubmitted(mod.key, mod.select);
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [confirmInstructor, setConfirmInstructor] = useState(false);
  const canApprove = hasPermission(mod.permission);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["approvals", mod.key] });
    queryClient.invalidateQueries({ queryKey: [mod.key] });
  };

  const approve = async (rec: any) => {
    const patch: any = {
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
      rejection_reason: null,
    };
    if (mod.key === "lab_sessions") patch.instructor_confirmed = confirmInstructor || rec.instructor_confirmed;
    if (mod.key === "technician_activities") patch.supervisor_verified = true;
    if (mod.key === "maintenance_logs") patch.supervisor_approved = true;
    const { error } = await supabase.from(mod.key as any).update(patch).eq("id", rec.id);
    if (error) return toast.error(error.message);
    toast.success("Approved");
    setSelected(null);
    setConfirmInstructor(false);
    refresh();
  };

  const reject = async (rec: any) => {
    if (!reason.trim()) return toast.error("Provide a rejection reason");
    const { error } = await supabase
      .from(mod.key as any)
      .update({ approval_status: "rejected", rejection_reason: reason, approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq("id", rec.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected — sent back to ARA");
    setSelected(null);
    setReason("");
    refresh();
  };

  if (!canApprove) {
    return <div className="rounded-md border border-border bg-muted/30 p-6 text-sm text-muted-foreground">You don't have permission to approve {mod.label.toLowerCase()}.</div>;
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Submitted</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Title / Subject</th>
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Location</th>
            <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
          {!isLoading && (data ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No pending submissions.</td></tr>}
          {(data ?? []).map((rec: any) => (
            <tr key={rec.id} className="hover:bg-muted/30">
              <td className="px-4 py-2 font-mono text-xs">{rec.submitted_at ? new Date(rec.submitted_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-2 font-medium max-w-md truncate">{rec[mod.titleField] ?? "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{rec.laboratories?.name ?? rec.equipment?.name ?? "—"}</td>
              <td className="px-4 py-2 text-right">
                <Button size="sm" variant="outline" onClick={() => { setSelected(rec); setConfirmInstructor(rec.instructor_confirmed ?? false); setReason(""); }}>
                  <Eye className="mr-2 h-3 w-3" /> Review
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review {mod.label} submission</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1 text-sm">
                {Object.entries(selected)
                  .filter(([k, v]) => v !== null && v !== "" && !["id", "created_at", "approved_by", "approved_at", "submitted_at", "approval_status", "laboratories", "equipment", "departments"].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground font-mono text-xs">{k}</span>
                      <span className="col-span-2 break-words">{String(v)}</span>
                    </div>
                  ))}
              </div>

              {mod.key === "lab_sessions" && (
                <div className="flex items-center gap-2 rounded-md border border-border p-3">
                  <Checkbox id="conf-instr" checked={confirmInstructor} onCheckedChange={(v) => setConfirmInstructor(!!v)} />
                  <Label htmlFor="conf-instr" className="cursor-pointer text-sm">Confirm instructor / supervisor was present</Label>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Rejection reason (only required to reject)</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Explain what needs to change..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button variant="destructive" onClick={() => reject(selected)}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => approve(selected)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Approvals() {
  const { hasPermission } = useAuth();
  const visible = MODULES.filter((m) => hasPermission(m.permission));

  if (visible.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Approvals</h1>
        <p className="text-sm text-muted-foreground">You don't have any approval permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve records submitted by ARAs</p>
      </div>
      <Tabs defaultValue={visible[0].key}>
        <TabsList>
          {visible.map((m) => <TabsTrigger key={m.key} value={m.key}>{m.label}</TabsTrigger>)}
        </TabsList>
        {visible.map((m) => (
          <TabsContent key={m.key} value={m.key}><ModulePanel mod={m} /></TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
