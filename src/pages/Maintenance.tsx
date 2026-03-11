import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const mockLogs = [
  { id: "MT-001", equipment: "Spectrophotometer UV-2600", date: "2026-03-08", type: "Preventive", problem: "Lamp replacement due", action: "Replaced deuterium lamp", technician: "Ato Kebede", approval: "Approved", status: "completed" },
  { id: "MT-002", equipment: "Autoclave SX-500", date: "2026-03-07", type: "Corrective", problem: "Pressure seal leak", action: "Replaced gasket", technician: "Ato Dawit", approval: "Pending", status: "pending" },
  { id: "MT-003", equipment: "Fume Hood #3", date: "2026-03-06", type: "Preventive", problem: "Filter replacement", action: "Scheduled", technician: "Ato Kebede", approval: "Pending", status: "scheduled" },
];

const statusMap: Record<string, { type: "success" | "warning" | "neutral"; label: string }> = {
  completed: { type: "success", label: "Complete" },
  pending: { type: "warning", label: "Pending" },
  scheduled: { type: "neutral", label: "Scheduled" },
};

export default function Maintenance() {
  const [search, setSearch] = useState("");
  const filtered = mockLogs.filter((l) => l.equipment.toLowerCase().includes(search.toLowerCase()) || l.technician.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipment Maintenance</h1>
          <p className="text-sm text-muted-foreground mt-1">Track maintenance activities and approvals</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Log Maintenance</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search maintenance logs..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Equipment</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Problem</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Action Taken</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Approval</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockLogs.filter((l) => l.equipment.toLowerCase().includes(search.toLowerCase())).map((l) => (
              <tr key={l.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{l.id}</td>
                <td className="px-4 py-2 font-medium">{l.equipment}</td>
                <td className="px-4 py-2">{l.date}</td>
                <td className="px-4 py-2">{l.type}</td>
                <td className="px-4 py-2 max-w-48 truncate">{l.problem}</td>
                <td className="px-4 py-2 max-w-48 truncate">{l.action}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={l.approval === "Approved" ? "success" : "warning"} label={l.approval} />
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={statusMap[l.status].type} label={statusMap[l.status].label} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
