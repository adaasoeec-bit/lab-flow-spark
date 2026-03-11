import { Button } from "@/components/ui/button";
import { Download, FileBarChart } from "lucide-react";

const reports = [
  { name: "Laboratory Usage Report", description: "Session frequency, utilization rates, and department usage", icon: FileBarChart },
  { name: "Equipment Inventory Report", description: "Full equipment list with status and calibration schedule", icon: FileBarChart },
  { name: "Maintenance Report", description: "Maintenance activities, costs, and pending approvals", icon: FileBarChart },
  { name: "Safety Inspection Report", description: "Compliance status, hazards identified, and corrective actions", icon: FileBarChart },
  { name: "Consumable Usage Report", description: "Material consumption, stock levels, and reorder needs", icon: FileBarChart },
  { name: "Technician Activity Report", description: "Work logs, hours tracked, and verification status", icon: FileBarChart },
];

export default function Reports() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and export system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div key={report.name} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-mono text-sm font-semibold">{report.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" /> PDF</Button>
              <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" /> Excel</Button>
              <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" /> CSV</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
