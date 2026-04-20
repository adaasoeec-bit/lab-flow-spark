import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useEquipment, useLaboratories } from "@/hooks/useSupabaseQuery";
import { EquipmentDialog } from "@/components/dialogs/EquipmentDialog";
import { CsvImportButton } from "@/components/CsvImportButton";
import { useAuth } from "@/contexts/AuthContext";

const statusMap: Record<string, { type: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  operational: { type: "success", label: "Operational" },
  under_maintenance: { type: "warning", label: "Maintenance" },
  out_of_service: { type: "danger", label: "Out of Service" },
  decommissioned: { type: "neutral", label: "Decommissioned" },
};

export default function Equipment() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: equipment, isLoading } = useEquipment();
  const { data: laboratories } = useLaboratories();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("equipment.create");

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
        {canCreate && (
          <div className="flex items-center gap-2">
            <CsvImportButton
              table="equipment"
              entityLabel="equipment"
              invalidateKey="equipment"
              templateFilename="equipment"
              templateColumns={["name", "category", "model", "serial_number", "laboratory_name", "status", "installation_date", "last_calibration", "next_calibration", "remarks"]}
              templateExample={{
                name: "Digital Multimeter",
                category: "Measurement",
                model: "Fluke 87V",
                serial_number: "SN-12345",
                laboratory_name: "Electrical Lab 1",
                status: "operational",
                installation_date: "2024-01-15",
                last_calibration: "2024-06-01",
                next_calibration: "2025-06-01",
                remarks: "",
              }}
              mapRow={(row) => {
                if (!row.name) return null;
                const lab = (laboratories ?? []).find((l: any) => l.name?.toLowerCase() === (row.laboratory_name ?? "").toLowerCase());
                const validStatuses = ["operational", "under_maintenance", "out_of_service", "decommissioned"];
                const status = validStatuses.includes(row.status) ? row.status : "operational";
                return {
                  name: row.name,
                  category: row.category || null,
                  model: row.model || null,
                  serial_number: row.serial_number || null,
                  laboratory_id: lab?.id ?? null,
                  status,
                  installation_date: row.installation_date || null,
                  last_calibration: row.last_calibration || null,
                  next_calibration: row.next_calibration || null,
                  remarks: row.remarks || null,
                };
              }}
            />
            <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment..." className="pl-9" />
        </div>
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
      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
