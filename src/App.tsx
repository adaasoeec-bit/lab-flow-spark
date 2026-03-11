import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LabSessions from "@/pages/LabSessions";
import Equipment from "@/pages/Equipment";
import Maintenance from "@/pages/Maintenance";
import SafetyInspections from "@/pages/SafetyInspections";
import Consumables from "@/pages/Consumables";
import TechnicianActivities from "@/pages/TechnicianActivities";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import SystemSettings from "@/pages/SystemSettings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<LabSessions />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/safety" element={<SafetyInspections />} />
            <Route path="/consumables" element={<Consumables />} />
            <Route path="/activities" element={<TechnicianActivities />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
