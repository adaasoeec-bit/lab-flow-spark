import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle } from "lucide-react";

const mockConsumables = [
  { id: "CM-001", name: "Ethanol (95%)", unit: "Liter", received: 50, issued: 38, balance: 12, issuedTo: "Chemistry Lab A", authorizedBy: "Dr. Abebe", technician: "Ato Kebede", date: "2026-03-09" },
  { id: "CM-002", name: "Microscope Slides", unit: "Box", received: 100, issued: 82, balance: 18, issuedTo: "Biology Lab B", authorizedBy: "Dr. Tigist", technician: "Ato Dawit", date: "2026-03-08" },
  { id: "CM-003", name: "Litmus Paper", unit: "Pack", received: 200, issued: 195, balance: 5, issuedTo: "Chemistry Lab A", authorizedBy: "Dr. Sara", technician: "Ato Kebede", date: "2026-03-07" },
  { id: "CM-004", name: "Petri Dishes", unit: "Pack", received: 80, issued: 45, balance: 35, issuedTo: "Biology Lab A", authorizedBy: "Dr. Meron", technician: "Ato Dawit", date: "2026-03-06" },
  { id: "CM-005", name: "Resistors (Assorted)", unit: "Kit", received: 30, issued: 28, balance: 2, issuedTo: "Physics Lab C", authorizedBy: "Dr. Hailu", technician: "Ato Yonas", date: "2026-03-05" },
];

const LOW_STOCK_THRESHOLD = 10;

export default function Consumables() {
  const [search, setSearch] = useState("");
  const filtered = mockConsumables.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Consumable Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">Laboratory materials inventory tracking</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Material</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search consumables..." className="pl-9" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Material Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unit</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Received</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Issued</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Balance</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Issued To</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-2 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-2 font-medium flex items-center gap-2">
                  {c.name}
                  {c.balance <= LOW_STOCK_THRESHOLD && <AlertTriangle className="h-3 w-3 text-warning" />}
                </td>
                <td className="px-4 py-2">{c.unit}</td>
                <td className="px-4 py-2 text-right font-mono">{c.received}</td>
                <td className="px-4 py-2 text-right font-mono">{c.issued}</td>
                <td className="px-4 py-2 text-right">
                  <StatusBadge
                    status={c.balance <= LOW_STOCK_THRESHOLD ? (c.balance <= 5 ? "danger" : "warning") : "success"}
                    label={String(c.balance)}
                  />
                </td>
                <td className="px-4 py-2">{c.issuedTo}</td>
                <td className="px-4 py-2 font-mono text-xs">{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
