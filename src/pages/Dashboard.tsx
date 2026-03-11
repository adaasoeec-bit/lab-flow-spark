import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { FlaskConical, Microscope, Wrench, ShieldCheck, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useLabSessions, useEquipment, useMaintenanceLogs, useSafetyInspections, useConsumables } from "@/hooks/useSupabaseQuery";

export default function Dashboard() {
  const { data: sessions } = useLabSessions();
  const { data: equipment } = useEquipment();
  const { data: maintenance } = useMaintenanceLogs();
  const { data: inspections } = useSafetyInspections();
  const { data: consumables } = useConsumables();

  const today = new Date().toISOString().slice(0, 10);
  const sessionsToday = sessions?.filter(s => s.date === today) ?? [];
  const pendingMaintenance = maintenance?.filter(m => m.status === "pending") ?? [];
  const lowStock = consumables?.filter(c => (c.balance ?? 0) <= 10) ?? [];

  const recentSessions = (sessions ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Sessions Today" value={sessionsToday.length} icon={FlaskConical} />
        <StatsCard title="Total Equipment" value={equipment?.length ?? 0} icon={Microscope} />
        <StatsCard title="Pending Maintenance" value={pendingMaintenance.length} icon={Wrench} trend={pendingMaintenance.length > 0 ? `${pendingMaintenance.length} need attention` : "All clear"} trendType={pendingMaintenance.length > 0 ? "down" : "up"} />
        <StatsCard title="Inspections" value={inspections?.length ?? 0} icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-sm font-semibold">Recent Sessions</h2>
          </div>
          <div className="divide-y divide-border">
            {recentSessions.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground text-center">No sessions recorded yet.</p>}
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.course_name}</p>
                  <p className="text-xs text-muted-foreground">{(s as any).laboratories?.name ?? "—"} · {s.start_time?.slice(0,5)}</p>
                </div>
                <StatusBadge status={s.instructor_confirmed ? "success" : "neutral"} label={s.instructor_confirmed ? "Confirmed" : "Pending"} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Maintenance Alerts
            </h2>
          </div>
          <div className="divide-y divide-border">
            {pendingMaintenance.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground text-center">No pending maintenance.</p>}
            {pendingMaintenance.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{(m as any).equipment?.name ?? "Equipment"}</p>
                  <p className="text-xs text-muted-foreground">{m.maintenance_type} · {m.maintenance_date}</p>
                </div>
                <StatusBadge status="warning" label="Pending" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium">{inspections?.length ?? 0} Inspections</p>
            <p className="text-xs text-muted-foreground">Total recorded</p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-warning" />
          <div>
            <p className="text-sm font-medium">{pendingMaintenance.length} Pending</p>
            <p className="text-xs text-muted-foreground">Maintenance logs awaiting review</p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium">{lowStock.length} Low Stock</p>
            <p className="text-xs text-muted-foreground">Consumables below threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
}
