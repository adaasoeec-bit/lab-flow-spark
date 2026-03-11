import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepartments, useLaboratories } from "@/hooks/useSupabaseQuery";

export default function SystemSettings() {
  const { data: departments } = useDepartments();
  const { data: laboratories } = useLaboratories();

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
          {(departments ?? []).map((d) => (
            <div key={d.id} className="py-2 text-sm flex items-center justify-between">
              <span>{d.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{d.abbreviation}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm">Add Department</Button>
      </div>

      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <h2 className="font-mono text-sm font-semibold">Laboratories</h2>
        <div className="divide-y divide-border">
          {(laboratories ?? []).map((l) => (
            <div key={l.id} className="py-2 text-sm flex items-center justify-between">
              <span>{l.name}</span>
              <span className="text-xs text-muted-foreground">{(l as any).departments?.name ?? ""}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm">Add Laboratory</Button>
      </div>
    </div>
  );
}
