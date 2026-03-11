import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useDepartments, useColleges } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function CollegesDepartments() {
  const { data: colleges, isLoading: loadingColleges } = useColleges();
  const { data: departments, isLoading: loadingDepts } = useDepartments();
  const { role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  // College dialog
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [collegeAbbr, setCollegeAbbr] = useState("");
  const [savingCollege, setSavingCollege] = useState(false);

  // Department dialog
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptAbbr, setDeptAbbr] = useState("");
  const [deptCollegeId, setDeptCollegeId] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  const handleAddCollege = async () => {
    if (!collegeName) return;
    setSavingCollege(true);
    const { error } = await supabase.from("colleges" as any).insert({ name: collegeName, abbreviation: collegeAbbr || null } as any);
    setSavingCollege(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "College added" });
      setCollegeOpen(false);
      setCollegeName("");
      setCollegeAbbr("");
      qc.invalidateQueries({ queryKey: ["colleges"] });
    }
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm("Delete this college?")) return;
    const { error } = await supabase.from("colleges" as any).delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "College deleted" }); qc.invalidateQueries({ queryKey: ["colleges"] }); }
  };

  const handleAddDept = async () => {
    if (!deptName) return;
    setSavingDept(true);
    const { error } = await supabase.from("departments").insert({
      name: deptName,
      abbreviation: deptAbbr || null,
      college_id: deptCollegeId || null,
    } as any);
    setSavingDept(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Department added" });
      setDeptOpen(false);
      setDeptName("");
      setDeptAbbr("");
      setDeptCollegeId("");
      qc.invalidateQueries({ queryKey: ["departments"] });
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Department deleted" }); qc.invalidateQueries({ queryKey: ["departments"] }); }
  };

  const collegeMap = new Map((colleges ?? []).map((c: any) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Colleges & Departments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage organizational structure</p>
      </div>

      {/* Colleges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold">Colleges</h2>
          {isAdmin && (
            <Dialog open={collegeOpen} onOpenChange={setCollegeOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add College</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add College</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Abbreviation</Label><Input value={collegeAbbr} onChange={(e) => setCollegeAbbr(e.target.value)} placeholder="e.g. CoET" /></div>
                </div>
                <DialogFooter><Button onClick={handleAddCollege} disabled={savingCollege}>{savingCollege ? "Saving…" : "Add College"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="rounded-md border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Abbreviation</th>
              {isAdmin && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {loadingColleges && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
              {(colleges ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.abbreviation ?? "—"}</td>
                  {isAdmin && <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCollege(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!loadingColleges && (colleges ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No colleges added yet.</div>}
        </div>
      </div>

      {/* Departments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold">Departments</h2>
          {isAdmin && (
            <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Department</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={deptName} onChange={(e) => setDeptName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Abbreviation</Label><Input value={deptAbbr} onChange={(e) => setDeptAbbr(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>College</Label>
                    <Select value={deptCollegeId} onValueChange={setDeptCollegeId}>
                      <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                      <SelectContent>
                        {(colleges ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button onClick={handleAddDept} disabled={savingDept}>{savingDept ? "Saving…" : "Add Department"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="rounded-md border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Abbreviation</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">College</th>
              {isAdmin && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {loadingDepts && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
              {(departments ?? []).map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{d.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{d.abbreviation ?? "—"}</td>
                  <td className="px-4 py-2 text-sm">{collegeMap.get(d.college_id) ?? "—"}</td>
                  {isAdmin && <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(d.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!loadingDepts && (departments ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No departments added yet.</div>}
        </div>
      </div>
    </div>
  );
}
