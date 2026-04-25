import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEquipment } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApprovalFooter, StatusBanner } from "./ApprovalFooter";
import type { Database } from "@/integrations/supabase/types";

type MType = Database["public"]["Enums"]["maintenance_type"];
type MStatus = Database["public"]["Enums"]["maintenance_status"];

interface Props { open: boolean; onOpenChange: (open: boolean) => void; editRecord?: any | null; }

const EMPTY = {
  equipment_id: "",
  maintenance_type: "corrective" as MType,
  status: "pending" as MStatus,
  maintenance_date: new Date().toISOString().split("T")[0],
  problem_reported: "",
  action_taken: "",
  remarks: "",
};

export function MaintenanceDialog({ open, onOpenChange, editRecord }: Props) {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { data: equipment } = useEquipment();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!editRecord;
  const status = editRecord?.approval_status ?? "draft";
  const canApprove = hasPermission("maintenance.approve");
  const isLocked = isEdit && status !== "draft" && status !== "rejected" && !canApprove;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        setForm({
          equipment_id: editRecord.equipment_id ?? "",
          maintenance_type: editRecord.maintenance_type ?? "corrective",
          status: editRecord.status ?? "pending",
          maintenance_date: editRecord.maintenance_date ?? new Date().toISOString().split("T")[0],
          problem_reported: editRecord.problem_reported ?? "",
          action_taken: editRecord.action_taken ?? "",
          remarks: editRecord.remarks ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editRecord]);

  const save = async (action: "draft" | "submit") => {
    if (!form.equipment_id) return toast.error("Select equipment");
    setLoading(true);
    const payload: any = {
      equipment_id: form.equipment_id,
      maintenance_type: form.maintenance_type,
      status: form.status,
      maintenance_date: form.maintenance_date,
      problem_reported: form.problem_reported || null,
      action_taken: form.action_taken || null,
      remarks: form.remarks || null,
    };
    if (action === "submit") {
      payload.approval_status = "submitted";
      payload.submitted_at = new Date().toISOString();
      payload.rejection_reason = null;
    } else {
      payload.approval_status = "draft";
    }
    if (!isEdit) payload.created_by = user?.id;
    const { error } = isEdit
      ? await supabase.from("maintenance_logs").update(payload).eq("id", editRecord.id)
      : await supabase.from("maintenance_logs").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(action === "submit" ? "Submitted for approval" : isEdit ? "Draft updated" : "Draft saved");
    queryClient.invalidateQueries({ queryKey: ["maintenance_logs"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Maintenance Log" : "Log Maintenance"}
            {isEdit && <span className="ml-2 text-xs font-mono uppercase text-muted-foreground">[{status}]</span>}
          </DialogTitle>
        </DialogHeader>
        <StatusBanner status={status} rejection_reason={editRecord?.rejection_reason} />
        <form onSubmit={(e) => { e.preventDefault(); save("draft"); }} className="space-y-4">
          <fieldset disabled={isLocked} className="space-y-4 contents">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Equipment *</Label>
                <Select value={form.equipment_id} onValueChange={v => setForm(f => ({ ...f, equipment_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>{(equipment ?? []).map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.maintenance_date} onChange={e => setForm(f => ({ ...f, maintenance_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.maintenance_type} onValueChange={v => setForm(f => ({ ...f, maintenance_type: v as MType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="calibration">Calibration</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as MStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Problem Reported</Label><Textarea value={form.problem_reported} onChange={e => setForm(f => ({ ...f, problem_reported: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Action Taken</Label><Textarea value={form.action_taken} onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} /></div>
            <p className="text-xs text-muted-foreground">Supervisor approval is granted by the Department Head from the Approvals page.</p>
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
