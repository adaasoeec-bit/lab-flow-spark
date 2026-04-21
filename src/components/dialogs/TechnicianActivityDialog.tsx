import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface Props { open: boolean; onOpenChange: (open: boolean) => void; editRecord?: any | null; }

const EMPTY = {
  activity_description: "",
  laboratory_id: "",
  course_supported: "",
  date: new Date().toISOString().split("T")[0],
  start_time: "",
  end_time: "",
  supervisor_verified: false,
};

export function TechnicianActivityDialog({ open, onOpenChange, editRecord }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: labs } = useLaboratories();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const isEdit = !!editRecord;

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
          supervisor_verified: editRecord.supervisor_verified ?? false,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.activity_description || !form.start_time) return toast.error("Description and start time are required");
    setLoading(true);
    const payload: any = {
      activity_description: form.activity_description,
      laboratory_id: form.laboratory_id || null,
      course_supported: form.course_supported || null,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      supervisor_verified: form.supervisor_verified,
    };
    if (!isEdit) payload.technician_id = user!.id;
    const { error } = isEdit
      ? await supabase.from("technician_activities").update(payload).eq("id", editRecord.id)
      : await supabase.from("technician_activities").insert(payload);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Activity updated" : "Activity logged");
    queryClient.invalidateQueries({ queryKey: ["technician_activities"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Activity" : "Log Activity"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center gap-2">
            <Checkbox id="sv" checked={form.supervisor_verified} onCheckedChange={v => setForm(f => ({ ...f, supervisor_verified: !!v }))} />
            <Label htmlFor="sv" className="cursor-pointer">Supervisor Verified</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save Changes" : "Log Activity"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
