import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useSafetyInspections } from "@/hooks/useSupabaseQuery";
import { SafetyInspectionDialog } from "@/components/dialogs/SafetyInspectionDialog";
import { RowActions } from "@/components/RowActions";
import { useAuth } from "@/contexts/AuthContext";

export default function SafetyInspections() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const { data: inspections, isLoading } = useSafetyInspections();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("safety.create");
  const canEdit = hasPermission("safety.edit");
  const canDelete = hasPermission("safety.delete");
  const showActions = canEdit || canDelete;

  const filtered = (inspections ?? []).filter((i) =>
    ((i as any).laboratories?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditRecord(null); setDialogOpen(true); };
  const openEdit = (record: any) => { setEditRecord(record); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Safety Inspections</h1>
          <p className="text-sm text-muted-foreground mt-1">Laboratory safety compliance records</p>
        </div>
        {canCreate && <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> New Inspection</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inspections..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Fire</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Electrical</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">PPE</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Exit</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hazards</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Follow-Up</th>
              {showActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={showActions ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{i.inspection_date}</td>
                <td className="px-4 py-2 font-medium">{(i as any).laboratories?.name ?? "—"}</td>
                <td className="px-4 py-2"><StatusBadge status={i.fire_safety ? "success" : "danger"} label={i.fire_safety ? "Pass" : "Fail"} /></td>
                <td className="px-4 py-2"><StatusBadge status={i.electrical_safety ? "success" : "danger"} label={i.electrical_safety ? "Pass" : "Fail"} /></td>
                <td className="px-4 py-2"><StatusBadge status={i.ppe_status ? "success" : "danger"} label={i.ppe_status ? "Pass" : "Fail"} /></td>
                <td className="px-4 py-2"><StatusBadge status={i.emergency_exit ? "success" : "danger"} label={i.emergency_exit ? "Pass" : "Fail"} /></td>
                <td className="px-4 py-2 max-w-40 truncate">{i.hazards_identified ?? "None"}</td>
                <td className="px-4 py-2 font-mono text-xs">{i.follow_up_date ?? "—"}</td>
                {showActions && (
                  <td className="px-4 py-2 text-right">
                    <RowActions table="safety_inspections" id={i.id} invalidateKey="safety_inspections" canEdit={canEdit} canDelete={canDelete} onEdit={() => openEdit(i)} itemLabel="inspection" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No inspections found.</div>}
      </div>
      <SafetyInspectionDialog open={dialogOpen} onOpenChange={setDialogOpen} editRecord={editRecord} />
    </div>
  );
}
