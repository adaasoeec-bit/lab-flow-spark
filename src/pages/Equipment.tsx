import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useEquipment, useLaboratories } from "@/hooks/useSupabaseQuery";
import { EquipmentDialog } from "@/components/dialogs/EquipmentDialog";
import { CsvImportButton } from "@/components/CsvImportButton";
import { RowActions } from "@/components/RowActions";
import { useAuth } from "@/contexts/AuthContext";

const statusMap: Record<string, { type: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  operational: { type: "success", label: "Operational" },
  under_maintenance: { type: "warning", label: "Maintenance" },
  out_of_service: { type: "danger", label: "Out of Service" },
  decommissioned: { type: "neutral", label: "Decommissioned" },
};

type TypeFilter = "all" | "fixed" | "consumable";

export default function Equipment() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const { data: equipment, isLoading } = useEquipment();
  const { data: laboratories } = useLaboratories();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("equipment.create");
  const canEdit = hasPermission("equipment.edit");
  const canDelete = hasPermission("equipment.delete");
  const showActions = canEdit || canDelete;

  const filtered = (equipment ?? []).filter((e: any) => {
    const itemType = e.equipment_type ?? "fixed";
    if (typeFilter !== "all" && itemType !== typeFilter) return false;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.category ?? "").toLowerCase().includes(q) ||
      (e.laboratories?.name ?? "").toLowerCase().includes(q) ||
      (e.shelf ?? "").toLowerCase().includes(q)
    );
  });

  const openAdd = () => { setEditRecord(null); setDialogOpen(true); };
  const openEdit = (record: any) => { setEditRecord(record); setDialogOpen(true); };

  const isConsumableView = typeFilter === "consumable";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Equipment</h1>
          <p className="text-sm text-muted-foreground mt-1">Unified inventory of fixed equipment and consumables</p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <CsvImportButton
              table="equipment"
              entityLabel="items"
              invalidateKey="equipment"
              templateFilename="equipment_consumables"
              templateColumns={["name", "equipment_type", "category", "model", "serial_number", "store_name", "shelf", "row_number", "quantity", "unit", "status", "last_calibration", "next_calibration", "remarks"]}
              templateExample={{
                name: "Digital Multimeter",
                equipment_type: "fixed",
                category: "Measurement",
                model: "Fluke 87V",
                serial_number: "SN-12345",
                store_name: "Electrical Lab 1",
                shelf: "A-3",
                row_number: "2",
                quantity: "",
                unit: "",
                status: "operational",
                last_calibration: "2024-06-01",
                next_calibration: "2025-06-01",
                remarks: "",
              }}
              mapRow={(row) => {
                if (!row.name) return null;
                const lab = (laboratories ?? []).find((l: any) => l.name?.toLowerCase() === (row.store_name ?? row.laboratory_name ?? "").toLowerCase());
                const validStatuses = ["operational", "under_maintenance", "out_of_service", "decommissioned"];
                const status = validStatuses.includes(row.status) ? row.status : "operational";
                const equipment_type = row.equipment_type === "consumable" ? "consumable" : "fixed";
                return {
                  name: row.name,
                  equipment_type,
                  category: row.category || null,
                  model: row.model || null,
                  serial_number: row.serial_number || null,
                  laboratory_id: lab?.id ?? null,
                  shelf: row.shelf || null,
                  row_number: row.row_number || null,
                  quantity: row.quantity ? Number(row.quantity) : null,
                  unit: row.unit || null,
                  status,
                  last_calibration: row.last_calibration || null,
                  next_calibration: row.next_calibration || null,
                  remarks: row.remarks || null,
                };
              }}
            />
            <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="fixed">Fixed Equipment</TabsTrigger>
            <TabsTrigger value="consumable">Consumables</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, category, store..." className="pl-9" />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Store</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Shelf / Row</th>
              {isConsumableView ? (
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Qty</th>
              ) : (
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Serial No.</th>
              )}
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              {showActions && <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={showActions ? 8 : 7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((e: any) => {
              const st = statusMap[e.status] ?? { type: "neutral" as const, label: e.status };
              const t = e.equipment_type ?? "fixed";
              const shelfRow = [e.shelf, e.row_number].filter(Boolean).join(" / ");
              return (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2">
                    <StatusBadge
                      status={t === "consumable" ? "warning" : "neutral"}
                      label={t === "consumable" ? "Consumable" : "Fixed"}
                    />
                  </td>
                  <td className="px-4 py-2">{e.category ?? "—"}</td>
                  <td className="px-4 py-2">{e.laboratories?.name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{shelfRow || "—"}</td>
                  {isConsumableView ? (
                    <td className="px-4 py-2 font-mono text-xs">
                      {e.quantity != null ? `${e.quantity}${e.unit ? " " + e.unit : ""}` : "—"}
                    </td>
                  ) : (
                    <td className="px-4 py-2 font-mono text-xs">{e.serial_number ?? "—"}</td>
                  )}
                  <td className="px-4 py-2"><StatusBadge status={st.type} label={st.label} /></td>
                  {showActions && (
                    <td className="px-4 py-2 text-right">
                      <RowActions table="equipment" id={e.id} invalidateKey="equipment" canEdit={canEdit} canDelete={canDelete} onEdit={() => openEdit(e)} itemLabel="item" />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No items found.</div>}
      </div>
      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editRecord={editRecord}
        defaultType={typeFilter === "consumable" ? "consumable" : "fixed"}
      />
    </div>
  );
}
