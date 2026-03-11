import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { useEquipment } from "@/hooks/useSupabaseQuery";

const statusMap: Record<string, { type: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  operational: { type: "success", label: "Operational" },
  under_maintenance: { type: "warning", label: "Maintenance" },
  out_of_service: { type: "danger", label: "Out of Service" },
  decommissioned: { type: "neutral", label: "Decommissioned" },
};

export default function Equipment() {
  const [search, setSearch] = useState("");
  const { data: equipment, isLoading } = useEquipment();

  const filtered = (equipment ?? []).filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
      ((e as any).laboratories?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Laboratory equipment inventory and tracking</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>
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
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Equipment Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Serial No.</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Next Calibration</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((e) => {
              const st = statusMap[e.status] ?? { type: "neutral" as const, label: e.status };
              return (
                <tr key={e.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2">{e.category ?? "—"}</td>
                  <td className="px-4 py-2">{(e as any).laboratories?.name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e.serial_number ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {e.next_calibration ? (
                      <StatusBadge status={new Date(e.next_calibration) <= new Date() ? "danger" : "neutral"} label={e.next_calibration} />
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={st.type} label={st.label} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No equipment found.</div>}
      </div>
    </div>
  );
}
