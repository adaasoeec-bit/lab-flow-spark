import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useConsumables } from "@/hooks/useSupabaseQuery";
import { ConsumableDialog } from "@/components/dialogs/ConsumableDialog";

const LOW_STOCK_THRESHOLD = 10;

export default function Consumables() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: consumables, isLoading } = useConsumables();

  const filtered = (consumables ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Consumable Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">Laboratory materials inventory tracking</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Material</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search consumables..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Material Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unit</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Received</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Issued</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Balance</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Laboratory</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Issued To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
            {filtered.map((c) => {
              const bal = c.balance ?? 0;
              return (
                <tr key={c.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-2 font-medium flex items-center gap-2">
                    {c.name}
                    {bal <= LOW_STOCK_THRESHOLD && <AlertTriangle className="h-3 w-3 text-warning" />}
                  </td>
                  <td className="px-4 py-2">{c.unit}</td>
                  <td className="px-4 py-2 text-right font-mono">{c.quantity_received}</td>
                  <td className="px-4 py-2 text-right font-mono">{c.quantity_issued}</td>
                  <td className="px-4 py-2 text-right">
                    <StatusBadge status={bal <= 5 ? "danger" : bal <= LOW_STOCK_THRESHOLD ? "warning" : "success"} label={String(bal)} />
                  </td>
                  <td className="px-4 py-2">{(c as any).laboratories?.name ?? "—"}</td>
                  <td className="px-4 py-2">{c.issued_to ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No consumables found.</div>}
      </div>
      <ConsumableDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
