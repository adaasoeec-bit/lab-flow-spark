import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useLaboratories } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApprovalFooter, StatusBanner } from "./ApprovalFooter";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; editRecord?: any | null; }

const EMPTY = {
  laboratory_id: "",
  inspection_date: new Date().toISOString().split("T")[0],
  fire_safety: false,
  electrical_safety: false,
  ppe_status: false,
  emergency_exit: false,
  hazards_identified: "",
  corrective_action: "",
  follow_up_date: "",
};

export function SafetyInspectionDialog({ open, onOpenChange, editRecord }: Props) {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: labs } = useLaboratories();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!editRecord;
  const status = editRecord?.approval_status ?? "draft";
  const canApprove = hasPermission("safety.approve");
  const isLocked = isEdit && status !== "draft" && status !== "rejected" && !canApprove;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        setForm({
          laboratory_id: editRecord.laboratory_id ?? "",
          inspection_date: editRecord.inspection_date ?? new Date().toISOString().split("T")[0],
          fire_safety: editRecord.fire_safety ?? false,
          electrical_safety: editRecord.electrical_safety ?? false,
          ppe_status: editRecord.ppe_status ?? false,
          emergency_exit: editRecord.emergency_exit ?? false,
          hazards_identified: editRecord.hazards_identified ?? "",
          corrective_action: editRecord.corrective_action ?? "",
          follow_up_date: editRecord.follow_up_date ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editRecord]);

  const toggle = (key: keyof typeof form) => setForm(f => ({ ...f, [key]: !f[key] }));

  const save = async (action: "draft" | "submit") => {
    setLoading(true);
    const payload: any = {
      laboratory_id: form.laboratory_id || null,
      inspection_date: form.inspection_date,
      fire_safety: form.fire_safety,
      electrical_safety: form.electrical_safety,
      ppe_status: form.ppe_status,
      emergency_exit: form.emergency_exit,
      hazards_identified: form.hazards_identified || null,
      corrective_action: form.corrective_action || null,
      follow_up_date: form.follow_up_date || null,
    };
    if (action === "submit") {
      payload.approval_status = "submitted";
      payload.submitted_at = new Date().toISOString();
      payload.rejection_reason = null;
    } else {
      payload.approval_status = "draft";
    }
    if (!isEdit) {
      payload.inspector_id = user?.id;
      payload.created_by = user?.id;
    }
    const { error } = isEdit
      ? await supabase.from("safety_inspections").update(payload).eq("id", editRecord.id)
      : await supabase.from("safety_inspections").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(action === "submit" ? "Submitted for approval" : isEdit ? "Draft updated" : "Draft saved");
    queryClient.invalidateQueries({ queryKey: ["safety_inspections"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Safety Inspection" : "New Safety Inspection"}
            {isEdit && <span className="ml-2 text-xs font-mono uppercase text-muted-foreground">[{status}]</span>}
          </DialogTitle>
        </DialogHeader>
        <StatusBanner status={status} rejection_reason={editRecord?.rejection_reason} />
        <form onSubmit={(e) => { e.preventDefault(); save("draft"); }} className="space-y-4">
          <fieldset disabled={isLocked} className="space-y-4 contents">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Laboratory</Label>
                <Select value={form.laboratory_id} onValueChange={v => setForm(f => ({ ...f, laboratory_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
                  <SelectContent>{(labs ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Inspection Date</Label>
                <Input type="date" value={form.inspection_date} onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([["fire_safety", "Fire Safety"], ["electrical_safety", "Electrical Safety"], ["ppe_status", "PPE Status"], ["emergency_exit", "Emergency Exit"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox checked={form[key] as boolean} onCheckedChange={() => toggle(key)} id={key} />
                  <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-1.5"><Label>Hazards Identified</Label><Textarea value={form.hazards_identified} onChange={e => setForm(f => ({ ...f, hazards_identified: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Corrective Action</Label><Textarea value={form.corrective_action} onChange={e => setForm(f => ({ ...f, corrective_action: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Follow-Up Date</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} /></div>
          </fieldset>
          <ApprovalFooter
            loading={loading}
            isLocked={isLocked}
            onCancel={() => onOpenChange(false)}
            onSaveDraft={() => save("draft")}
            onSubmit={() => save("submit")}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
