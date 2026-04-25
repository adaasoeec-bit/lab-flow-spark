import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLaboratories } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApprovalFooter, StatusBanner } from "./ApprovalFooter";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; editRecord?: any | null; }

const EMPTY = {
  activity_description: "",
  laboratory_id: "",
  course_supported: "",
  date: new Date().toISOString().split("T")[0],
  start_time: "",
  end_time: "",
};

export function TechnicianActivityDialog({ open, onOpenChange, editRecord }: Props) {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: labs } = useLaboratories();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!editRecord;
  const status = editRecord?.approval_status ?? "draft";
  const canApprove = hasPermission("activities.approve");
  const isLocked = isEdit && status !== "draft" && status !== "rejected" && !canApprove;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        setForm({
          activity_description: editRecord.activity_description ?? "",
          laboratory_id: editRecord.laboratory_id ?? "",
          course_supported: editRecord.course_supported ?? "",
          date: editRecord.date ?? new Date().toISOString().split("T")[0],
          start_time: editRecord.start_time ?? "",
          end_time: editRecord.end_time ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editRecord]);

  const save = async (action: "draft" | "submit") => {
    if (!form.activity_description || !form.start_time) return toast.error("Description and start time are required");
    setLoading(true);
    const payload: any = {
      activity_description: form.activity_description,
      laboratory_id: form.laboratory_id || null,
      course_supported: form.course_supported || null,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time || null,
    };
    if (action === "submit") {
      payload.approval_status = "submitted";
      payload.submitted_at = new Date().toISOString();
      payload.rejection_reason = null;
    } else {
      payload.approval_status = "draft";
    }
    if (!isEdit) {
      payload.technician_id = user!.id;
      payload.created_by = user!.id;
    }
    const { error } = isEdit
      ? await supabase.from("technician_activities").update(payload).eq("id", editRecord.id)
      : await supabase.from("technician_activities").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(action === "submit" ? "Submitted for approval" : isEdit ? "Draft updated" : "Draft saved");
    queryClient.invalidateQueries({ queryKey: ["technician_activities"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Activity" : "Log Activity"}
            {isEdit && <span className="ml-2 text-xs font-mono uppercase text-muted-foreground">[{status}]</span>}
          </DialogTitle>
        </DialogHeader>
        <StatusBanner status={status} rejection_reason={editRecord?.rejection_reason} />
        <form onSubmit={(e) => { e.preventDefault(); save("draft"); }} className="space-y-4">
          <fieldset disabled={isLocked} className="space-y-4 contents">
            <div className="space-y-1.5">
              <Label>Activity Description *</Label>
              <Textarea value={form.activity_description} onChange={e => setForm(f => ({ ...f, activity_description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Laboratory</Label>
                <Select value={form.laboratory_id} onValueChange={v => setForm(f => ({ ...f, laboratory_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
                  <SelectContent>{(labs ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start Time *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Course Supported</Label>
              <Input value={form.course_supported} onChange={e => setForm(f => ({ ...f, course_supported: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">Supervisor verification is granted by the Department Head from the Approvals page.</p>
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
