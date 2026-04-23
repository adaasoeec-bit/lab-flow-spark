import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Building2, GraduationCap, FlaskConical, Warehouse } from "lucide-react";
import { useDepartments, useColleges, useLaboratories, useStores } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { CsvImportButton } from "@/components/CsvImportButton";

export default function CollegesDepartments() {
  const { data: colleges, isLoading: loadingColleges } = useColleges();
  const { data: departments, isLoading: loadingDepts } = useDepartments();
  const { data: laboratories, isLoading: loadingLabs } = useLaboratories();
  const { data: stores, isLoading: loadingStores } = useStores();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const canCreateCollege = hasPermission("colleges.create");
  const canEditCollege = hasPermission("colleges.edit");
  const canDeleteCollege = hasPermission("colleges.delete");
  const canCreateDept = hasPermission("departments.create");
  const canEditDept = hasPermission("departments.edit");
  const canDeleteDept = hasPermission("departments.delete");
  const canCreateLab = hasPermission("labs.create");
  const canEditLab = hasPermission("labs.edit");
  const canDeleteLab = hasPermission("labs.delete");
  const canCreateStore = hasPermission("stores.create");
  const canEditStore = hasPermission("stores.edit");
  const canDeleteStore = hasPermission("stores.delete");

  // College dialog
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [collegeEditId, setCollegeEditId] = useState<string | null>(null);
  const [collegeName, setCollegeName] = useState("");
  const [collegeAbbr, setCollegeAbbr] = useState("");
  const [savingCollege, setSavingCollege] = useState(false);

  // Department dialog
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptEditId, setDeptEditId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptAbbr, setDeptAbbr] = useState("");
  const [deptCollegeId, setDeptCollegeId] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  // Laboratory dialog
  const [labOpen, setLabOpen] = useState(false);
  const [labEditId, setLabEditId] = useState<string | null>(null);
  const [labName, setLabName] = useState("");
  const [labLocation, setLabLocation] = useState("");
  const [labCapacity, setLabCapacity] = useState("");
  const [labDeptId, setLabDeptId] = useState("");
  const [savingLab, setSavingLab] = useState(false);

  // Store dialog
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeEditId, setStoreEditId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [storeDeptId, setStoreDeptId] = useState("");
  const [savingStore, setSavingStore] = useState(false);

  const resetCollege = () => { setCollegeEditId(null); setCollegeName(""); setCollegeAbbr(""); };
  const resetDept = () => { setDeptEditId(null); setDeptName(""); setDeptAbbr(""); setDeptCollegeId(""); };
  const resetLab = () => { setLabEditId(null); setLabName(""); setLabLocation(""); setLabCapacity(""); setLabDeptId(""); };
  const resetStore = () => { setStoreEditId(null); setStoreName(""); setStoreLocation(""); setStoreDeptId(""); };

  const openNewCollege = () => { resetCollege(); setCollegeOpen(true); };
  const openEditCollege = (c: any) => {
    setCollegeEditId(c.id);
    setCollegeName(c.name ?? "");
    setCollegeAbbr(c.abbreviation ?? "");
    setCollegeOpen(true);
  };

  const openNewDept = () => { resetDept(); setDeptOpen(true); };
  const openEditDept = (d: any) => {
    setDeptEditId(d.id);
    setDeptName(d.name ?? "");
    setDeptAbbr(d.abbreviation ?? "");
    setDeptCollegeId(d.college_id ?? "");
    setDeptOpen(true);
  };

  const openNewLab = () => { resetLab(); setLabOpen(true); };
  const openEditLab = (l: any) => {
    setLabEditId(l.id);
    setLabName(l.name ?? "");
    setLabLocation(l.location ?? "");
    setLabCapacity(l.capacity != null ? String(l.capacity) : "");
    setLabDeptId(l.department_id ?? "");
    setLabOpen(true);
  };

  const handleSaveCollege = async () => {
    if (!collegeName) return;
    setSavingCollege(true);
    const payload = { name: collegeName, abbreviation: collegeAbbr || null };
    const { error } = collegeEditId
      ? await supabase.from("colleges" as any).update(payload as any).eq("id", collegeEditId)
      : await supabase.from("colleges" as any).insert(payload as any);
    setSavingCollege(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: collegeEditId ? "College updated" : "College added" });
      setCollegeOpen(false);
      resetCollege();
      qc.invalidateQueries({ queryKey: ["colleges"] });
    }
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm("Delete this college?")) return;
    const { error } = await supabase.from("colleges" as any).delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "College deleted" }); qc.invalidateQueries({ queryKey: ["colleges"] }); }
  };

  const handleSaveDept = async () => {
    if (!deptName) return;
    setSavingDept(true);
    const payload = {
      name: deptName,
      abbreviation: deptAbbr || null,
      college_id: deptCollegeId || null,
    };
    const { error } = deptEditId
      ? await supabase.from("departments").update(payload as any).eq("id", deptEditId)
      : await supabase.from("departments").insert(payload as any);
    setSavingDept(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: deptEditId ? "Department updated" : "Department added" });
      setDeptOpen(false);
      resetDept();
      qc.invalidateQueries({ queryKey: ["departments"] });
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Department deleted" }); qc.invalidateQueries({ queryKey: ["departments"] }); }
  };

  const handleSaveLab = async () => {
    if (!labName) return;
    setSavingLab(true);
    const payload = {
      name: labName,
      location: labLocation || null,
      capacity: labCapacity ? parseInt(labCapacity) : null,
      department_id: labDeptId || null,
    };
    const { error } = labEditId
      ? await supabase.from("laboratories").update(payload as any).eq("id", labEditId)
      : await supabase.from("laboratories").insert(payload);
    setSavingLab(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: labEditId ? "Laboratory updated" : "Laboratory added" });
      setLabOpen(false);
      resetLab();
      qc.invalidateQueries({ queryKey: ["laboratories"] });
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!confirm("Delete this laboratory? This may affect linked equipment, sessions, etc.")) return;
    const { error } = await supabase.from("laboratories").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Laboratory deleted" }); qc.invalidateQueries({ queryKey: ["laboratories"] }); }
  };

  const openNewStore = () => { resetStore(); setStoreOpen(true); };
  const openEditStore = (s: any) => {
    setStoreEditId(s.id);
    setStoreName(s.name ?? "");
    setStoreLocation(s.location ?? "");
    setStoreDeptId(s.department_id ?? "");
    setStoreOpen(true);
  };

  const handleSaveStore = async () => {
    if (!storeName) return;
    setSavingStore(true);
    const payload = {
      name: storeName,
      location: storeLocation || null,
      department_id: storeDeptId || null,
    };
    const { error } = storeEditId
      ? await supabase.from("stores" as any).update(payload as any).eq("id", storeEditId)
      : await supabase.from("stores" as any).insert(payload as any);
    setSavingStore(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: storeEditId ? "Store updated" : "Store added" });
      setStoreOpen(false);
      resetStore();
      qc.invalidateQueries({ queryKey: ["stores"] });
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm("Delete this store?")) return;
    const { error } = await supabase.from("stores" as any).delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Store deleted" }); qc.invalidateQueries({ queryKey: ["stores"] }); }
  };

  const collegeMap = new Map((colleges ?? []).map((c: any) => [c.id, c.name]));
  const showCollegeActions = canEditCollege || canDeleteCollege;
  const showDeptActions = canEditDept || canDeleteDept;
  const showLabActions = canEditLab || canDeleteLab;
  const showStoreActions = canEditStore || canDeleteStore;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Colleges, Departments, Laboratories & Stores</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage organizational structure, lab facilities and stores</p>
      </div>

      <Tabs defaultValue="colleges" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Stores
          </TabsTrigger>
        </TabsList>

        {/* Colleges Tab */}
        <TabsContent value="colleges" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Colleges</h2>
            {canCreateCollege && (
              <Button size="sm" onClick={openNewCollege}><Plus className="mr-2 h-4 w-4" /> Add College</Button>
            )}
          </div>
          <div className="rounded-md border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Abbreviation</th>
                {showCollegeActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loadingColleges && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {(colleges ?? []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{c.abbreviation ?? "—"}</td>
                    {showCollegeActions && <td className="px-4 py-2 text-right">
                      {canEditCollege && (
                        <Button variant="ghost" size="icon" onClick={() => openEditCollege(c)}><Pencil className="h-4 w-4" /></Button>
                      )}
                      {canDeleteCollege && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCollege(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingColleges && (colleges ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No colleges added yet.</div>}
          </div>

          <Dialog open={collegeOpen} onOpenChange={(o) => { setCollegeOpen(o); if (!o) resetCollege(); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>{collegeEditId ? "Edit College" : "Add College"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Abbreviation</Label><Input value={collegeAbbr} onChange={(e) => setCollegeAbbr(e.target.value)} placeholder="e.g. CoET" /></div>
              </div>
              <DialogFooter><Button onClick={handleSaveCollege} disabled={savingCollege}>{savingCollege ? "Saving…" : collegeEditId ? "Save Changes" : "Add College"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Departments</h2>
            {canCreateDept && (
              <Button size="sm" onClick={openNewDept}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
            )}
          </div>
          <div className="rounded-md border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Abbreviation</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">College</th>
                {showDeptActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loadingDepts && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {(departments ?? []).map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{d.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{d.abbreviation ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{collegeMap.get(d.college_id) ?? "—"}</td>
                    {showDeptActions && <td className="px-4 py-2 text-right">
                      {canEditDept && (
                        <Button variant="ghost" size="icon" onClick={() => openEditDept(d)}><Pencil className="h-4 w-4" /></Button>
                      )}
                      {canDeleteDept && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(d.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingDepts && (departments ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No departments added yet.</div>}
          </div>

          <Dialog open={deptOpen} onOpenChange={(o) => { setDeptOpen(o); if (!o) resetDept(); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>{deptEditId ? "Edit Department" : "Add Department"}</DialogTitle></DialogHeader>
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
              <DialogFooter><Button onClick={handleSaveDept} disabled={savingDept}>{savingDept ? "Saving…" : deptEditId ? "Save Changes" : "Add Department"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Laboratories Tab */}
        <TabsContent value="laboratories" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Laboratories</h2>
            <div className="flex items-center gap-2">
              {canCreateLab && (
                <CsvImportButton
                  table="laboratories"
                  entityLabel="laboratories"
                  invalidateKey="laboratories"
                  templateFilename="laboratories"
                  templateColumns={["name", "location", "capacity", "department_name"]}
                  templateExample={{
                    name: "Electrical Lab 1",
                    location: "Block A, Room 201",
                    capacity: "30",
                    department_name: "Electrical Engineering",
                  }}
                  mapRow={(row) => {
                    if (!row.name) return null;
                    const dept = (departments ?? []).find((d: any) => d.name?.toLowerCase() === (row.department_name ?? "").toLowerCase());
                    return {
                      name: row.name,
                      location: row.location || null,
                      capacity: row.capacity ? parseInt(row.capacity) : null,
                      department_id: dept?.id ?? null,
                    };
                  }}
                />
              )}
              {canCreateLab && (
                <Button size="sm" onClick={openNewLab}><Plus className="mr-2 h-4 w-4" /> Add Laboratory</Button>
              )}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Capacity</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Department</th>
                {showLabActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {loadingLabs && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {(laboratories ?? []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{l.name}</td>
                    <td className="px-4 py-2 text-sm">{l.location ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{l.capacity ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{l.departments?.name ?? "—"}</td>
                    {showLabActions && <td className="px-4 py-2 text-right">
                      {canEditLab && (
                        <Button variant="ghost" size="icon" onClick={() => openEditLab(l)}><Pencil className="h-4 w-4" /></Button>
                      )}
                      {canDeleteLab && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(l.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loadingLabs && (laboratories ?? []).length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">No laboratories added yet.</div>}
          </div>

          <Dialog open={labOpen} onOpenChange={(o) => { setLabOpen(o); if (!o) resetLab(); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>{labEditId ? "Edit Laboratory" : "Add Laboratory"}</DialogTitle></DialogHeader>
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
              <DialogFooter><Button onClick={handleSaveLab} disabled={savingLab}>{savingLab ? "Saving…" : labEditId ? "Save Changes" : "Add Laboratory"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
