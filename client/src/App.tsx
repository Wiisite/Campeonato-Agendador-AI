import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import DashboardPage from "@/pages/dashboard";
import SearchPage from "@/pages/search";
import LeadsPage from "@/pages/leads";
import MeetingsPage from "@/pages/meetings";
import ReportsPage from "@/pages/reports";
import ProspectorPage from "@/pages/prospector";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/prospector" component={ProspectorPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/meetings" component={MeetingsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) return null;
  if (!data?.authenticated) return <LoginPage />;
  return <>{children}</>;
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sportscrm-theme">
        <TooltipProvider>
          <AuthGate>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto bg-background">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthGate>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
