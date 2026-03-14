import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import RoleManagement from "@/pages/RoleManagement";
import SystemSettings from "@/pages/SystemSettings";
import CollegesDepartments from "@/pages/CollegesDepartments";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import ChangePassword from "@/pages/ChangePassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, passwordChangeRequired } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  if (!session) return <Navigate to="/auth" replace />;
  if (passwordChangeRequired) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions" element={<LabSessions />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/safety" element={<SafetyInspections />} />
        <Route path="/consumables" element={<Consumables />} />
        <Route path="/activities" element={<TechnicianActivities />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/colleges" element={<CollegesDepartments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
