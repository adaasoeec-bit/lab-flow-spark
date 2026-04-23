import {
  LayoutDashboard, Microscope, Wrench, ShieldCheck,
  ClipboardList, FileBarChart, Users, Settings, LogOut, Building2, UserCircle, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import astuLogo from "@/assets/astu-logo.png";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { title: "Logbook", url: "/logbook", icon: ClipboardList, permission: "lab_sessions.view", altPermission: "activities.view" },
  { title: "Equipment", url: "/equipment", icon: Microscope, permission: "equipment.view" },
  { title: "Maintenance", url: "/maintenance", icon: Wrench, permission: "maintenance.view" },
  { title: "Safety Inspections", url: "/safety", icon: ShieldCheck, permission: "safety.view" },
];

const adminNav = [
  { title: "Reports", url: "/reports", icon: FileBarChart, permission: "reports.view" },
  { title: "User Management", url: "/users", icon: Users, permission: "users.view" },
  { title: "Role Management", url: "/roles", icon: Shield, permission: "roles.view" },
  { title: "Colleges, Depts & Labs", url: "/colleges", icon: Building2, permission: "colleges.view" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "settings.view" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, role, signOut, hasPermission } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const visibleMain = mainNav.filter((n: any) => hasPermission(n.permission) || (n.altPermission && hasPermission(n.altPermission)));
  const visibleAdmin = adminNav.filter((n) => hasPermission(n.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <img src={astuLogo} alt="ASTU" className="h-8 w-8 rounded-full flex-shrink-0" />
          {!collapsed && (
            <span className="font-mono text-sm font-bold text-sidebar-primary tracking-wider">LMIS</span>
          )}
        </div>
        {!collapsed && profile && (
          <div className="mt-3">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name || profile.email}</p>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">
              {role ?? "user"}
            </p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {visibleMain.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end={item.url === "/"}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")}>
              <NavLink to="/profile">
                <UserCircle className="h-4 w-4" />
                {!collapsed && <span>Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
