import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LabSessions from "@/pages/LabSessions";
import TechnicianActivities from "@/pages/TechnicianActivities";
import { useAuth } from "@/contexts/AuthContext";

export default function Logbook() {
  const { hasPermission } = useAuth();
  const canSessions = hasPermission("lab_sessions.view");
  const canActivities = hasPermission("activities.view");
  const [tab, setTab] = useState<string>(canSessions ? "sessions" : "activities");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Logbook</h1>
        <p className="text-sm text-muted-foreground mt-1">Unified record of laboratory sessions and technician activities</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {canSessions && <TabsTrigger value="sessions">Lab Sessions</TabsTrigger>}
          {canActivities && <TabsTrigger value="activities">Technician Activities</TabsTrigger>}
        </TabsList>
        {canSessions && (
          <TabsContent value="sessions" className="mt-4">
            <LabSessions />
          </TabsContent>
        )}
        {canActivities && (
          <TabsContent value="activities" className="mt-4">
            <TechnicianActivities />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
