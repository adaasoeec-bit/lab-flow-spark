import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useLaboratories } from "@/hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; editRecord?: any | null; }

const EMPTY = {
  name: "",
  unit: "pcs",
  quantity_received: 0,
  quantity_issued: 0,
  laboratory_id: "",
  issued_to: "",
};

export function ConsumableDialog({ open, onOpenChange, editRecord }: Props) {
  const queryClient = useQueryClient();
  const { data: labs } = useLaboratories();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        setForm({
          name: editRecord.name ?? "",
          unit: editRecord.unit ?? "pcs",
          quantity_received: editRecord.quantity_received ?? 0,
          quantity_issued: editRecord.quantity_issued ?? 0,
          laboratory_id: editRecord.laboratory_id ?? "",
          issued_to: editRecord.issued_to ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Material name is required");
    setLoading(true);
    const qr = Number(form.quantity_received);
    const qi = Number(form.quantity_issued);
    const payload = {
      name: form.name,
      unit: form.unit,
      quantity_received: qr,
      quantity_issued: qi,
      balance: qr - qi,
      laboratory_id: form.laboratory_id || null,
      issued_to: form.issued_to || null,
    };
    const { error } = isEdit
      ? await supabase.from("consumables").update(payload).eq("id", editRecord.id)
      : await supabase.from("consumables").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Consumable updated" : "Consumable added");
    queryClient.invalidateQueries({ queryKey: ["consumables"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Consumable" : "Add Consumable Material"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Material Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs, liters, kg..." />
            </div>
            <div className="space-y-1.5">
              <Label>Qty Received</Label>
              <Input type="number" min={0} value={form.quantity_received} onChange={e => setForm(f => ({ ...f, quantity_received: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Qty Issued</Label>
              <Input type="number" min={0} value={form.quantity_issued} onChange={e => setForm(f => ({ ...f, quantity_issued: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Laboratory</Label>
              <Select value={form.laboratory_id} onValueChange={v => setForm(f => ({ ...f, laboratory_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger>
                <SelectContent>{(labs ?? []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issued To</Label>
              <Input value={form.issued_to} onChange={e => setForm(f => ({ ...f, issued_to: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save Changes" : "Add Material"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
