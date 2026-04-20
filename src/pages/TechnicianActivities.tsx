import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useTechnicianActivities } from "@/hooks/useSupabaseQuery";
import { TechnicianActivityDialog } from "@/components/dialogs/TechnicianActivityDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function TechnicianActivities() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: activities, isLoading } = useTechnicianActivities();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("activities.create");

  const filtered = (activities ?? []).filter((a) =>
    a.activity_description.toLowerCase().includes(search.toLowerCase()) ||
    (a.course_supported ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Technician Activities</h1>
          <p className="text-sm text-muted-foreground mt-1">Daily activity log and supervisor verification</p>
        </div>
        {canCreate && <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Log Activity</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Activity</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Course</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{a.date}</td>
                <td className="px-4 py-2">{(a as any).laboratories?.name ?? "—"}</td>
                <td className="px-4 py-2 max-w-60 truncate">{a.activity_description}</td>
                <td className="px-4 py-2">{a.course_supported ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.start_time?.slice(0,5)}–{a.end_time?.slice(0,5) ?? "..."}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={a.supervisor_verified ? "success" : "warning"} label={a.supervisor_verified ? "Verified" : "Pending"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No activities found.</div>}
      </div>
      <TechnicianActivityDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
