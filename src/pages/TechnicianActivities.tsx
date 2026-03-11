import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const mockActivities = [
  { id: "TA-001", date: "2026-03-10", technician: "Ato Kebede", lab: "Chemistry Lab A", description: "Prepared reagents for CHEM 101 session", course: "CHEM 101", start: "07:30", end: "08:00", verified: true },
  { id: "TA-002", date: "2026-03-10", technician: "Ato Kebede", lab: "Chemistry Lab A", description: "Cleaned and stored glassware after session", course: "CHEM 101", start: "10:00", end: "10:45", verified: false },
  { id: "TA-003", date: "2026-03-10", technician: "Ato Dawit", lab: "Biology Lab B", description: "Calibrated microscopes for BIO 201", course: "BIO 201", start: "09:00", end: "09:30", verified: true },
  { id: "TA-004", date: "2026-03-10", technician: "Ato Yonas", lab: "Physics Lab C", description: "Set up optics bench equipment", course: "PHY 301", start: "13:00", end: "13:45", verified: false },
];

export default function TechnicianActivities() {
  const [search, setSearch] = useState("");
  const filtered = mockActivities.filter((a) => a.technician.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Technician Activities</h1>
          <p className="text-sm text-muted-foreground mt-1">Daily activity log and supervisor verification</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Log Activity</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Technician</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Activity</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Course</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{a.id}</td>
                <td className="px-4 py-2">{a.date}</td>
                <td className="px-4 py-2 font-medium">{a.technician}</td>
                <td className="px-4 py-2">{a.lab}</td>
                <td className="px-4 py-2 max-w-60 truncate">{a.description}</td>
                <td className="px-4 py-2">{a.course}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.start}–{a.end}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={a.verified ? "success" : "warning"} label={a.verified ? "Verified" : "Pending"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
