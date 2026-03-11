import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";

const mockEquipment = [
  { id: "EQ-001", name: "Spectrophotometer UV-2600", category: "Analytical", model: "UV-2600", serial: "SH-2024-001", lab: "Chemistry Lab A", status: "operational", lastCal: "2026-01-15", nextCal: "2026-03-15", technician: "Ato Kebede" },
  { id: "EQ-002", name: "Autoclave SX-500", category: "Sterilization", model: "SX-500", serial: "SX-2023-045", lab: "Biology Lab B", status: "maintenance", lastCal: "2025-12-01", nextCal: "2026-06-01", technician: "Ato Dawit" },
  { id: "EQ-003", name: "Digital Oscilloscope", category: "Electronics", model: "DSO-2200", serial: "DS-2024-112", lab: "Physics Lab C", status: "operational", lastCal: "2026-02-20", nextCal: "2026-08-20", technician: "Ato Yonas" },
  { id: "EQ-004", name: "Centrifuge 5810R", category: "General", model: "5810R", serial: "EP-2022-078", lab: "Biology Lab A", status: "operational", lastCal: "2026-01-10", nextCal: "2026-07-10", technician: "Ato Dawit" },
  { id: "EQ-005", name: "Fume Hood #3", category: "Safety", model: "FH-300", serial: "FH-2021-003", lab: "Chemistry Lab A", status: "needs-repair", lastCal: "2025-11-05", nextCal: "2026-03-10", technician: "Ato Kebede" },
];

const statusMap: Record<string, { type: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  operational: { type: "success", label: "Operational" },
  maintenance: { type: "warning", label: "Maintenance" },
  "needs-repair": { type: "danger", label: "Needs Repair" },
  decommissioned: { type: "neutral", label: "Decommissioned" },
};

export default function Equipment() {
  const [search, setSearch] = useState("");

  const filtered = mockEquipment.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.lab.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Laboratory equipment inventory and tracking</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Equipment
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Equipment Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Serial No.</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Next Calibration</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{e.id}</td>
                <td className="px-4 py-2 font-medium">{e.name}</td>
                <td className="px-4 py-2">{e.category}</td>
                <td className="px-4 py-2">{e.lab}</td>
                <td className="px-4 py-2 font-mono text-xs">{e.serial}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  <StatusBadge
                    status={new Date(e.nextCal) <= new Date() ? "danger" : "neutral"}
                    label={e.nextCal}
                  />
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={statusMap[e.status].type} label={statusMap[e.status].label} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
