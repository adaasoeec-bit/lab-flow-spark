import {
  LayoutDashboard, FlaskConical, Microscope, Wrench, ShieldCheck,
  Package, ClipboardList, FileBarChart, Users, Settings, LogOut, Beaker,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lab Sessions", url: "/sessions", icon: FlaskConical },
  { title: "Equipment", url: "/equipment", icon: Microscope },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Safety Inspections", url: "/safety", icon: ShieldCheck },
  { title: "Consumables", url: "/consumables", icon: Package },
  { title: "Technician Activities", url: "/activities", icon: ClipboardList },
];

const adminNav = [
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, role, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const visibleAdmin = role === "admin" || role === "supervisor" ? adminNav : adminNav.filter(n => n.url === "/reports");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Beaker className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && (
            <span className="font-mono text-sm font-bold text-sidebar-primary tracking-wider">LMIS</span>
          )}
        </div>
        {!collapsed && profile && (
          <div className="mt-3">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name || profile.email}</p>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">{role ?? "user"}</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
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
