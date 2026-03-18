import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Building2, GraduationCap, FlaskConical } from "lucide-react";
import { useDepartments, useColleges, useLaboratories } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function CollegesDepartments() {
  const { data: colleges, isLoading: loadingColleges } = useColleges();
  const { data: departments, isLoading: loadingDepts } = useDepartments();
  const { data: laboratories, isLoading: loadingLabs } = useLaboratories();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const canCreateCollege = hasPermission("colleges.create");
  const canDeleteCollege = hasPermission("colleges.delete");
  const canCreateDept = hasPermission("departments.create");
  const canDeleteDept = hasPermission("departments.delete");
  const canCreateLab = hasPermission("labs.create");
  const canDeleteLab = hasPermission("labs.delete");

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

  // Laboratory dialog
  const [labOpen, setLabOpen] = useState(false);
  const [labName, setLabName] = useState("");
  const [labLocation, setLabLocation] = useState("");
  const [labCapacity, setLabCapacity] = useState("");
  const [labDeptId, setLabDeptId] = useState("");
  const [savingLab, setSavingLab] = useState(false);

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

  const handleAddLab = async () => {
    if (!labName) return;
    setSavingLab(true);
    const { error } = await supabase.from("laboratories").insert({
      name: labName,
      location: labLocation || null,
      capacity: labCapacity ? parseInt(labCapacity) : null,
      department_id: labDeptId || null,
    });
    setSavingLab(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Laboratory added" });
      setLabOpen(false);
      setLabName("");
      setLabLocation("");
      setLabCapacity("");
      setLabDeptId("");
      qc.invalidateQueries({ queryKey: ["laboratories"] });
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!confirm("Delete this laboratory? This may affect linked equipment, sessions, etc.")) return;
    const { error } = await supabase.from("laboratories").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Laboratory deleted" }); qc.invalidateQueries({ queryKey: ["laboratories"] }); }
  };

  const collegeMap = new Map((colleges ?? []).map((c: any) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Colleges, Departments & Laboratories</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage organizational structure and lab facilities</p>
      </div>

      <Tabs defaultValue="colleges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colleges" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Colleges
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="laboratories" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Laboratories
          </TabsTrigger>
        </TabsList>

        {/* Colleges Tab */}
        <TabsContent value="colleges" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Colleges</h2>
            {canCreateCollege && (
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
                {canDeleteCollege && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loadingColleges && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {(colleges ?? []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{c.abbreviation ?? "—"}</td>
                    {canDeleteCollege && <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCollege(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingColleges && (colleges ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No colleges added yet.</div>}
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Departments</h2>
            {canCreateDept && (
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
                {canDeleteDept && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loadingDepts && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {(departments ?? []).map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{d.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{d.abbreviation ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{collegeMap.get(d.college_id) ?? "—"}</td>
                    {canDeleteDept && <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(d.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingDepts && (departments ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No departments added yet.</div>}
          </div>
        </TabsContent>

        {/* Laboratories Tab */}
        <TabsContent value="laboratories" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Laboratories</h2>
            {canCreateLab && (
              <Dialog open={labOpen} onOpenChange={setLabOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Laboratory</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Laboratory</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Chemistry Lab 1" /></div>
                    <div className="space-y-2"><Label>Location</Label><Input value={labLocation} onChange={(e) => setLabLocation(e.target.value)} placeholder="e.g. Building A, Room 201" /></div>
                    <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={labCapacity} onChange={(e) => setLabCapacity(e.target.value)} placeholder="e.g. 30" /></div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={labDeptId} onValueChange={setLabDeptId}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {(departments ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleAddLab} disabled={savingLab}>{savingLab ? "Saving…" : "Add Laboratory"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="rounded-md border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Capacity</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Department</th>
                {canDeleteLab && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loadingLabs && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {(laboratories ?? []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{l.name}</td>
                    <td className="px-4 py-2 text-sm">{l.location ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{l.capacity ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{l.departments?.name ?? "—"}</td>
                    {canDeleteLab && <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(l.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingLabs && (laboratories ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No laboratories added yet.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}