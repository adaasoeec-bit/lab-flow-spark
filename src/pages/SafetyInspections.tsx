import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const mockInspections = [
  { id: "SI-001", date: "2026-03-08", lab: "Chemistry Lab A", inspector: "Ato Kebede", fire: "Pass", electrical: "Pass", ppe: "Pass", exit: "Pass", hazards: "None", action: "N/A", followUp: "" },
  { id: "SI-002", date: "2026-03-07", lab: "Biology Lab B", inspector: "Ato Dawit", fire: "Pass", electrical: "Fail", ppe: "Pass", exit: "Pass", hazards: "Exposed wiring near sink", action: "Electrical team notified", followUp: "2026-03-14" },
  { id: "SI-003", date: "2026-03-05", lab: "Physics Lab C", inspector: "Ato Yonas", fire: "Pass", electrical: "Pass", ppe: "Fail", exit: "Pass", hazards: "Insufficient goggles", action: "Order placed", followUp: "2026-03-12" },
];

export default function SafetyInspections() {
  const [search, setSearch] = useState("");
  const filtered = mockInspections.filter((i) => i.lab.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Safety Inspections</h1>
          <p className="text-sm text-muted-foreground mt-1">Laboratory safety compliance records</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Inspection</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inspections..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Inspector</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Fire</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Electrical</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">PPE</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Hazards</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Follow-Up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{i.id}</td>
                <td className="px-4 py-2">{i.date}</td>
                <td className="px-4 py-2 font-medium">{i.lab}</td>
                <td className="px-4 py-2">{i.inspector}</td>
                <td className="px-4 py-2"><StatusBadge status={i.fire === "Pass" ? "success" : "danger"} label={i.fire} /></td>
                <td className="px-4 py-2"><StatusBadge status={i.electrical === "Pass" ? "success" : "danger"} label={i.electrical} /></td>
                <td className="px-4 py-2"><StatusBadge status={i.ppe === "Pass" ? "success" : "danger"} label={i.ppe} /></td>
                <td className="px-4 py-2 max-w-40 truncate">{i.hazards}</td>
                <td className="px-4 py-2 font-mono text-xs">{i.followUp || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
