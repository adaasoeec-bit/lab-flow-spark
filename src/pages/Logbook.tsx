import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useLabSessions } from "@/hooks/useSupabaseQuery";
import { LogbookDialog } from "@/components/dialogs/LogbookDialog";
import { RowActions } from "@/components/RowActions";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/15 text-green-700 dark:text-green-400",
  rejected: "bg-destructive/15 text-destructive",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

export default function Logbook() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const { data: sessions, isLoading } = useLabSessions();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("lab_sessions.create");
  const canEdit = hasPermission("lab_sessions.edit");
  const canDelete = hasPermission("lab_sessions.delete");
  const showActions = canEdit || canDelete;

  const filtered = (sessions ?? []).filter(
    (s: any) =>
      s.course_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.laboratories?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.remarks ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditRecord(null); setDialogOpen(true); };
  const openEdit = (record: any) => { setEditRecord(record); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Logbook</h1>
          <p className="text-sm text-muted-foreground mt-1">Your lab sessions & technician activities — save as draft, then submit for Department Head approval</p>
        </div>
        {canCreate && <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add New Log</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Course / Activity</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Users</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Instructor</th>
              {showActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={showActions ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{s.date}</td>
                <td className="px-4 py-2">{s.laboratories?.name ?? "—"}</td>
                <td className="px-4 py-2 font-medium max-w-xs truncate">{s.course_name}</td>
                <td className="px-4 py-2">{s.activity_type}</td>
                <td className="px-4 py-2 text-center">{s.number_of_users}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5) ?? "..."}</td>
                <td className="px-4 py-2"><StatusPill status={s.approval_status ?? "draft"} /></td>
                <td className="px-4 py-2 text-xs">{s.instructor_confirmed ? "✓ confirmed" : "—"}</td>
                {showActions && (
                  <td className="px-4 py-2 text-right">
                    <RowActions table="lab_sessions" id={s.id} invalidateKey="lab_sessions" canEdit={canEdit} canDelete={canDelete} onEdit={() => openEdit(s)} itemLabel="log entry" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No log entries found.</div>
        )}
      </div>
      <LogbookDialog open={dialogOpen} onOpenChange={setDialogOpen} editRecord={editRecord} />
    </div>
  );
}
