import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useMaintenanceLogs } from "@/hooks/useSupabaseQuery";
import { MaintenanceDialog } from "@/components/dialogs/MaintenanceDialog";
import { RowActions } from "@/components/RowActions";
import { useAuth } from "@/contexts/AuthContext";

const statusMap: Record<string, { type: "success" | "warning" | "neutral" | "info"; label: string }> = {
  completed: { type: "success", label: "Complete" },
  pending: { type: "warning", label: "Pending" },
  in_progress: { type: "info", label: "In Progress" },
  cancelled: { type: "neutral", label: "Cancelled" },
};

export default function Maintenance() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const { data: logs, isLoading } = useMaintenanceLogs();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("maintenance.create");
  const canEdit = hasPermission("maintenance.edit");
  const canDelete = hasPermission("maintenance.delete");
  const showActions = canEdit || canDelete;

  const filtered = (logs ?? []).filter((l) =>
    ((l as any).equipment?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (l.problem_reported ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditRecord(null); setDialogOpen(true); };
  const openEdit = (record: any) => { setEditRecord(record); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipment Maintenance</h1>
          <p className="text-sm text-muted-foreground mt-1">Track maintenance activities and approvals</p>
        </div>
        {canCreate && <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Log Maintenance</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search maintenance logs..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Equipment</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Problem</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Action Taken</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Approval</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              {showActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={showActions ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((l) => {
              const st = statusMap[l.status] ?? { type: "neutral" as const, label: l.status };
              return (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{(l as any).equipment?.name ?? "—"}</td>
                  <td className="px-4 py-2">{l.maintenance_date}</td>
                  <td className="px-4 py-2 capitalize">{l.maintenance_type}</td>
                  <td className="px-4 py-2 max-w-48 truncate">{l.problem_reported ?? "—"}</td>
                  <td className="px-4 py-2 max-w-48 truncate">{l.action_taken ?? "—"}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={l.supervisor_approved ? "success" : "warning"} label={l.supervisor_approved ? "Approved" : "Pending"} />
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={st.type} label={st.label} /></td>
                  {showActions && (
                    <td className="px-4 py-2 text-right">
                      <RowActions table="maintenance_logs" id={l.id} invalidateKey="maintenance_logs" canEdit={canEdit} canDelete={canDelete} onEdit={() => openEdit(l)} itemLabel="maintenance log" />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No maintenance logs found.</div>}
      </div>
      <MaintenanceDialog open={dialogOpen} onOpenChange={setDialogOpen} editRecord={editRecord} />
    </div>
  );
}
