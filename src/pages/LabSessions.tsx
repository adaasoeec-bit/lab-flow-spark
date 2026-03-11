import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { useLabSessions } from "@/hooks/useSupabaseQuery";

export default function LabSessions() {
  const [search, setSearch] = useState("");
  const { data: sessions, isLoading } = useLabSessions();

  const filtered = (sessions ?? []).filter(
    (s) =>
      s.course_name.toLowerCase().includes(search.toLowerCase()) ||
      ((s as any).laboratories?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Laboratory Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Session usage logbook</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Session</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sessions..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Course</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Activity</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Users</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{s.date}</td>
                <td className="px-4 py-2">{(s as any).laboratories?.name ?? "—"}</td>
                <td className="px-4 py-2 font-medium">{s.course_name}</td>
                <td className="px-4 py-2">{s.activity_type}</td>
                <td className="px-4 py-2 text-center">{s.number_of_users}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5) ?? "..."}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={s.instructor_confirmed ? "success" : "neutral"} label={s.instructor_confirmed ? "Confirmed" : "Pending"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No sessions found.</div>
        )}
      </div>
    </div>
  );
}
