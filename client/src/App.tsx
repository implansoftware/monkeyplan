import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminRepairCenters from "@/pages/admin/repair-centers";
import AdminTickets from "@/pages/admin/tickets";
import AdminRepairs from "@/pages/admin/repairs";
import AdminInventory from "@/pages/admin/inventory";
import AdminProducts from "@/pages/admin/products";
import AdminInvoices from "@/pages/admin/invoices";
import AdminChat from "@/pages/admin/chat";
import AdminActivityLogs from "@/pages/admin/activity-logs";
import AdminAnalytics from "@/pages/admin/analytics";

// Reseller pages
import ResellerDashboard from "@/pages/reseller/dashboard";
import ResellerOrders from "@/pages/reseller/orders";
import ResellerNewRepair from "@/pages/reseller/new-repair";
import ResellerCustomers from "@/pages/reseller/customers";

// Repair Center pages
import RepairCenterDashboard from "@/pages/repair-center/dashboard";
import RepairCenterRepairs from "@/pages/repair-center/repairs";
import RepairCenterInventory from "@/pages/repair-center/inventory";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerRepairs from "@/pages/customer/repairs";
import CustomerRepairDetail from "@/pages/customer/repair-detail";
import CustomerTickets from "@/pages/customer/tickets";
import CustomerTicketDetail from "@/pages/customer/ticket-detail";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/repair-centers" component={AdminRepairCenters} />
      <ProtectedRoute path="/admin/repairs" component={AdminRepairs} />
      <ProtectedRoute path="/admin/tickets" component={AdminTickets} />
      <ProtectedRoute path="/admin/inventory" component={AdminInventory} />
      <ProtectedRoute path="/admin/products" component={AdminProducts} />
      <ProtectedRoute path="/admin/invoices" component={AdminInvoices} />
      <ProtectedRoute path="/admin/chat" component={AdminChat} />
      <ProtectedRoute path="/admin/activity-logs" component={AdminActivityLogs} />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} />
      
      {/* Reseller routes */}
      <ProtectedRoute path="/reseller" component={ResellerDashboard} />
      <ProtectedRoute path="/reseller/orders" component={ResellerOrders} />
      <ProtectedRoute path="/reseller/customers" component={ResellerCustomers} />
      <ProtectedRoute path="/reseller/new-repair" component={ResellerNewRepair} />
      
      {/* Repair Center routes */}
      <ProtectedRoute path="/repair-center" component={RepairCenterDashboard} />
      <ProtectedRoute path="/repair-center/repairs" component={RepairCenterRepairs} />
      <ProtectedRoute path="/repair-center/inventory" component={RepairCenterInventory} />
      
      {/* Customer routes */}
      <ProtectedRoute path="/customer" component={CustomerDashboard} />
      <ProtectedRoute path="/customer/repairs" component={CustomerRepairs} />
      <ProtectedRoute path="/customer/repairs/:id" component={CustomerRepairDetail} />
      <ProtectedRoute path="/customer/tickets" component={CustomerTickets} />
      <ProtectedRoute path="/customer/tickets/:id" component={CustomerTicketDetail} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-border">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-7xl mx-auto">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
