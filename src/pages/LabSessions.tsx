import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Terminal } from "lucide-react";

const mockSessions = [
  { id: "LS-001", date: "2026-03-10", lab: "Chemistry Lab A", course: "CHEM 101", activity: "Organic Synthesis", dept: "Chemistry", users: 25, start: "08:00", end: "10:00", instructor: "Dr. Abebe", technician: "Ato Kebede", status: "completed" },
  { id: "LS-002", date: "2026-03-10", lab: "Biology Lab B", course: "BIO 201", activity: "Microscopy", dept: "Biology", users: 30, start: "10:00", end: "12:00", instructor: "Dr. Tigist", technician: "Ato Dawit", status: "in-progress" },
  { id: "LS-003", date: "2026-03-10", lab: "Physics Lab C", course: "PHY 301", activity: "Optics Experiment", dept: "Physics", users: 20, start: "14:00", end: "16:00", instructor: "Dr. Hailu", technician: "Ato Yonas", status: "scheduled" },
  { id: "LS-004", date: "2026-03-09", lab: "Chemistry Lab A", course: "CHEM 201", activity: "Titration", dept: "Chemistry", users: 28, start: "08:00", end: "10:00", instructor: "Dr. Sara", technician: "Ato Kebede", status: "completed" },
  { id: "LS-005", date: "2026-03-09", lab: "Biology Lab A", course: "BIO 101", activity: "Cell Culture", dept: "Biology", users: 22, start: "10:00", end: "12:00", instructor: "Dr. Meron", technician: "Ato Dawit", status: "completed" },
];

const statusMap: Record<string, { type: "success" | "info" | "neutral"; label: string }> = {
  completed: { type: "success", label: "Complete" },
  "in-progress": { type: "info", label: "In Progress" },
  scheduled: { type: "neutral", label: "Scheduled" },
};

export default function LabSessions() {
  const [search, setSearch] = useState("");
  const [quickEntry, setQuickEntry] = useState("");

  const filtered = mockSessions.filter(
    (s) =>
      s.course.toLowerCase().includes(search.toLowerCase()) ||
      s.lab.toLowerCase().includes(search.toLowerCase()) ||
      s.instructor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Laboratory Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Session usage logbook</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      {/* Quick Entry */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <Input
            value={quickEntry}
            onChange={(e) => setQuickEntry(e.target.value)}
            placeholder='Quick entry: "chem101 organic synthesis 25 users"'
            className="border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Course</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Activity</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Users</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Instructor</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{s.id}</td>
                <td className="px-4 py-2">{s.date}</td>
                <td className="px-4 py-2">{s.lab}</td>
                <td className="px-4 py-2 font-medium">{s.course}</td>
                <td className="px-4 py-2">{s.activity}</td>
                <td className="px-4 py-2 text-center">{s.users}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.start}–{s.end}</td>
                <td className="px-4 py-2">{s.instructor}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={statusMap[s.status].type} label={statusMap[s.status].label} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No sessions match your search.
          </div>
        )}
      </div>
    </div>
  );
}
