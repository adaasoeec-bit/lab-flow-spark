import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FlaskConical,
  Microscope,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

const recentSessions = [
  { id: "LS-001", course: "CHEM 101", lab: "Chemistry Lab A", time: "08:00–10:00", status: "completed" as const },
  { id: "LS-002", course: "BIO 201", lab: "Biology Lab B", time: "10:00–12:00", status: "in-progress" as const },
  { id: "LS-003", course: "PHY 301", lab: "Physics Lab C", time: "14:00–16:00", status: "scheduled" as const },
];

const maintenanceAlerts = [
  { equipment: "Spectrophotometer UV-2600", type: "Calibration Due", date: "2026-03-12" },
  { equipment: "Autoclave SX-500", type: "Preventive Maintenance", date: "2026-03-15" },
  { equipment: "Fume Hood #3", type: "Filter Replacement", date: "2026-03-10" },
];

const statusMap = {
  "completed": { type: "success" as const, label: "Complete" },
  "in-progress": { type: "info" as const, label: "In Progress" },
  "scheduled": { type: "neutral" as const, label: "Scheduled" },
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Sessions Today" value={8} icon={FlaskConical} trend="+2 from yesterday" trendType="up" />
        <StatsCard title="Total Equipment" value={142} icon={Microscope} trend="3 need attention" trendType="down" />
        <StatsCard title="Pending Maintenance" value={5} icon={Wrench} trend="2 overdue" trendType="down" />
        <StatsCard title="Safety Score" value="94%" icon={ShieldCheck} trend="Last inspection: 2d ago" trendType="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sessions */}
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-sm font-semibold">Recent Sessions</h2>
          </div>
          <div className="divide-y divide-border">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.course}</p>
                  <p className="text-xs text-muted-foreground">{s.lab} · {s.time}</p>
                </div>
                <StatusBadge status={statusMap[s.status].type} label={statusMap[s.status].label} />
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Maintenance Alerts
            </h2>
          </div>
          <div className="divide-y divide-border">
            {maintenanceAlerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.equipment}</p>
                  <p className="text-xs text-muted-foreground">{a.type}</p>
                </div>
                <StatusBadge
                  status={new Date(a.date) <= new Date() ? "danger" : "warning"}
                  label={a.date}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium">12 Inspections</p>
            <p className="text-xs text-muted-foreground">All compliant this month</p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-warning" />
          <div>
            <p className="text-sm font-medium">3 Pending Approvals</p>
            <p className="text-xs text-muted-foreground">Maintenance logs awaiting review</p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium">Low Stock Alert</p>
            <p className="text-xs text-muted-foreground">4 consumables below threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
}
