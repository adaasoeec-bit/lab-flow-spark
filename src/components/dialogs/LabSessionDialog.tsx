import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLaboratories, useDepartments } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabSessionDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: labs } = useLaboratories();
  const { data: departments } = useDepartments();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    course_name: "",
    laboratory_id: "",
    department_id: "",
    activity_type: "practical",
    number_of_users: 0,
    start_time: "",
    end_time: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_name || !form.start_time) return toast.error("Course name and start time are required");
    setLoading(true);
    const { error } = await supabase.from("lab_sessions").insert({
      ...form,
      number_of_users: Number(form.number_of_users),
      laboratory_id: form.laboratory_id || null,
      department_id: form.department_id || null,
      end_time: form.end_time || null,
      remarks: form.remarks || null,
      created_by: user?.id,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Session created");
    queryClient.invalidateQueries({ queryKey: ["lab_sessions"] });
    onOpenChange(false);
    setForm({ course_name: "", laboratory_id: "", department_id: "", activity_type: "practical", number_of_users: 0, start_time: "", end_time: "", date: new Date().toISOString().split("T")[0], remarks: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Lab Session</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Course Name *</Label>
              <Input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} />
            </div>
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
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                <SelectContent>{(departments ?? []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Activity Type</Label>
              <Select value={form.activity_type} onValueChange={v => setForm(f => ({ ...f, activity_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="practical">Practical</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="demonstration">Demonstration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Number of Users</Label>
              <Input type="number" min={0} value={form.number_of_users} onChange={e => setForm(f => ({ ...f, number_of_users: Number(e.target.value) }))} />
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
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Session"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
