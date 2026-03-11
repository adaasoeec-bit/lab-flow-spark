import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SystemSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure LMIS system parameters</p>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <h2 className="font-mono text-sm font-semibold">Institution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>University Name</Label>
            <Input defaultValue="Adama Science and Technology University" />
          </div>
          <div className="space-y-2">
            <Label>Abbreviation</Label>
            <Input defaultValue="ASTU" />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <h2 className="font-mono text-sm font-semibold">Departments</h2>
        <div className="divide-y divide-border">
          {["Chemistry", "Biology", "Physics", "Computer Science", "Electrical Engineering"].map((d) => (
            <div key={d} className="py-2 text-sm">{d}</div>
          ))}
        </div>
        <Button variant="outline" size="sm">Add Department</Button>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <h2 className="font-mono text-sm font-semibold">Laboratories</h2>
        <div className="divide-y divide-border">
          {["Chemistry Lab A", "Chemistry Lab B", "Biology Lab A", "Biology Lab B", "Physics Lab C"].map((l) => (
            <div key={l} className="py-2 text-sm">{l}</div>
          ))}
        </div>
        <Button variant="outline" size="sm">Add Laboratory</Button>
      </div>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
