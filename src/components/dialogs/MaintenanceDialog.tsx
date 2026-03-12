import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEquipment } from "@/hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type MType = Database["public"]["Enums"]["maintenance_type"];
type MStatus = Database["public"]["Enums"]["maintenance_status"];

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export function MaintenanceDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { data: equipment } = useEquipment();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    equipment_id: "",
    maintenance_type: "corrective" as MType,
    status: "pending" as MStatus,
    maintenance_date: new Date().toISOString().split("T")[0],
    problem_reported: "",
    action_taken: "",
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.equipment_id) return toast.error("Select equipment");
    setLoading(true);
    const { error } = await supabase.from("maintenance_logs").insert({
      equipment_id: form.equipment_id,
      maintenance_type: form.maintenance_type,
      status: form.status,
      maintenance_date: form.maintenance_date,
      problem_reported: form.problem_reported || null,
      action_taken: form.action_taken || null,
      remarks: form.remarks || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Maintenance log created");
    queryClient.invalidateQueries({ queryKey: ["maintenance_logs"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log Maintenance</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Log"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
