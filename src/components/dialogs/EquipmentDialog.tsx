import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import type { Database } from "@/integrations/supabase/types";

type EquipmentStatus = Database["public"]["Enums"]["equipment_status"];
type EquipmentType = "fixed" | "consumable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRecord?: any | null;
  defaultType?: EquipmentType;
}

const EMPTY = {
  name: "",
  category: "",
  equipment_type: "fixed" as EquipmentType,
  model: "",
  serial_number: "",
  laboratory_id: "",
  shelf: "",
  row_number: "",
  quantity: "",
  unit: "",
  status: "operational" as EquipmentStatus,
  last_calibration: "",
  next_calibration: "",
  remarks: "",
};

export function EquipmentDialog({ open, onOpenChange, editRecord, defaultType = "fixed" }: Props) {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { data: labs } = useLaboratories();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!editRecord;
  const status = editRecord?.approval_status ?? "draft";
  const canApprove = hasPermission("equipment.approve");
  const isLocked = isEdit && status !== "draft" && status !== "rejected" && !canApprove;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        setForm({
          name: editRecord.name ?? "",
          category: editRecord.category ?? "",
          equipment_type: (editRecord.equipment_type as EquipmentType) ?? "fixed",
          model: editRecord.model ?? "",
          serial_number: editRecord.serial_number ?? "",
          laboratory_id: editRecord.laboratory_id ?? "",
          shelf: editRecord.shelf ?? "",
          row_number: editRecord.row_number ?? "",
          quantity: editRecord.quantity != null ? String(editRecord.quantity) : "",
          unit: editRecord.unit ?? "",
          status: editRecord.status ?? "operational",
          last_calibration: editRecord.last_calibration ?? "",
          next_calibration: editRecord.next_calibration ?? "",
          remarks: editRecord.remarks ?? "",
        });
      } else {
        setForm({ ...EMPTY, equipment_type: defaultType });
      }
    }
  }, [open, editRecord, defaultType]);

  const isConsumable = form.equipment_type === "consumable";

  const save = async (action: "draft" | "submit") => {
    if (!form.name) return toast.error("Item name is required");
    setLoading(true);
    const payload: any = {
      name: form.name,
      category: form.category || null,
      equipment_type: form.equipment_type,
      model: form.model || null,
      serial_number: form.serial_number || null,
      laboratory_id: form.laboratory_id || null,
      shelf: form.shelf || null,
      row_number: form.row_number || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit: form.unit || null,
      status: form.status,
      last_calibration: form.last_calibration || null,
      next_calibration: form.next_calibration || null,
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
      ? await supabase.from("equipment").update(payload).eq("id", editRecord.id)
      : await supabase.from("equipment").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(action === "submit" ? "Submitted for approval" : isEdit ? "Draft updated" : "Draft saved");
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Item" : "Add Equipment / Consumable"}
            {isEdit && <span className="ml-2 text-xs font-mono uppercase text-muted-foreground">[{status}]</span>}
          </DialogTitle>
        </DialogHeader>
        <StatusBanner status={status} rejection_reason={editRecord?.rejection_reason} />
        <form onSubmit={(e) => { e.preventDefault(); save("draft"); }} className="space-y-4">
          <fieldset disabled={isLocked} className="space-y-4 contents">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={form.equipment_type}
                onValueChange={(v) => setForm((f) => ({ ...f, equipment_type: v as EquipmentType }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Equipment</SelectItem>
                  <SelectItem value="consumable">Consumable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Store</Label>
              <Select value={form.laboratory_id} onValueChange={v => setForm(f => ({ ...f, laboratory_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                <SelectContent>{(labs ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Shelf</Label>
              <Input
                placeholder="e.g. A-3"
                value={form.shelf}
                onChange={e => setForm(f => ({ ...f, shelf: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Row Number</Label>
              <Input
                placeholder="e.g. 2"
                value={form.row_number}
                onChange={e => setForm(f => ({ ...f, row_number: e.target.value }))}
              />
            </div>
            {isConsumable && (
              <>
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Input
                    placeholder="pcs, box, liter..."
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as EquipmentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isConsumable && (
              <>
                <div className="space-y-1.5">
                  <Label>Last Calibration</Label>
                  <Input type="date" value={form.last_calibration} onChange={e => setForm(f => ({ ...f, last_calibration: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Next Calibration</Label>
                  <Input type="date" value={form.next_calibration} onChange={e => setForm(f => ({ ...f, next_calibration: e.target.value }))} />
                </div>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
