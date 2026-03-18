import { Bot, TerminalSquare, List, Settings, LogOut, Clock, KeyRound, Activity, Database, ScrollText, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { title: 'Script Editor', url: '/', icon: TerminalSquare, desc: 'Write & run code' },
    { title: 'Commands', url: '/commands', icon: List, desc: 'Manage commands' },
    { title: 'Automation', url: '/cron', icon: Clock, desc: 'CRON scheduling' },
  ];

  const adminItems = [
    { title: 'API Keys', url: '/secrets', icon: KeyRound, desc: 'Manage environment variables' },
    { title: 'Analytics', url: '/analytics', icon: Activity, desc: 'Usage insights' },
    { title: 'Knowledge Base', url: '/knowledge-base', icon: Database, desc: 'Reference documents' },
    { title: 'Execution Logs', url: '/logs', icon: ScrollText, desc: 'Command history' },
    { title: 'Settings', url: '/settings', icon: Settings, desc: 'System config' },
  ];

  return (
    <Sidebar className="border-r border-border/60">
      <SidebarHeader className="border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-sidebar flex items-center justify-center">
              <Zap className="w-1.5 h-1.5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight text-foreground">Assistant Hub</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Admin Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2 pb-1 pt-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.desc}
                    className={`h-9 rounded-lg px-2 text-sm transition-all duration-150 ${
                      isActive(item.url)
                        ? 'bg-primary/10 text-primary font-medium border border-primary/15'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-2.5 w-full">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isActive(item.url) && <ChevronRight className="h-3 w-3 opacity-50" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 bg-border/40" />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2 pb-1">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.desc}
                    className={`h-9 rounded-lg px-2 text-sm transition-all duration-150 ${
                      isActive(item.url)
                        ? 'bg-primary/10 text-primary font-medium border border-primary/15'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-2.5 w-full">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isActive(item.url) && <ChevronRight className="h-3 w-3 opacity-50" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="h-9 rounded-lg px-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
