import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLaboratories } from "@/hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type EquipmentStatus = Database["public"]["Enums"]["equipment_status"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { data: labs } = useLaboratories();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    model: "",
    serial_number: "",
    laboratory_id: "",
    status: "operational" as EquipmentStatus,
    installation_date: "",
    last_calibration: "",
    next_calibration: "",
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Equipment name is required");
    setLoading(true);
    const { error } = await supabase.from("equipment").insert({
      name: form.name,
      category: form.category || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      laboratory_id: form.laboratory_id || null,
      status: form.status,
      installation_date: form.installation_date || null,
      last_calibration: form.last_calibration || null,
      next_calibration: form.next_calibration || null,
      remarks: form.remarks || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Equipment added");
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
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
              <Label>Laboratory</Label>
              <Select value={form.laboratory_id} onValueChange={v => setForm(f => ({ ...f, laboratory_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
                <SelectContent>{(labs ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
            <div className="space-y-1.5">
              <Label>Installation Date</Label>
              <Input type="date" value={form.installation_date} onChange={e => setForm(f => ({ ...f, installation_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Calibration</Label>
              <Input type="date" value={form.last_calibration} onChange={e => setForm(f => ({ ...f, last_calibration: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Next Calibration</Label>
              <Input type="date" value={form.next_calibration} onChange={e => setForm(f => ({ ...f, next_calibration: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add Equipment"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
