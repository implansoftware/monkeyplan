import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { TicketNotificationsProvider } from "@/contexts/TicketNotificationsContext";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminResellers from "@/pages/admin/resellers";
import AdminRepairCenters from "@/pages/admin/repair-centers";
import AdminTickets from "@/pages/admin/tickets";
import AdminTicketDetail from "@/pages/admin/ticket-detail";
import AdminRepairs from "@/pages/admin/repairs";
import AdminInventory from "@/pages/admin/inventory";
import AdminProducts from "@/pages/admin/products";
import AdminPartsOrders from "@/pages/admin/parts-orders";
import AdminInvoices from "@/pages/admin/invoices";
import AdminReports from "@/pages/admin/reports";
import AdminChat from "@/pages/admin/chat";
import AdminActivityLogs from "@/pages/admin/activity-logs";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";
import AdminServiceCatalog from "@/pages/admin/service-catalog";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminSupplierOrders from "@/pages/admin/supplier-orders";
import AdminSupplierReturns from "@/pages/admin/supplier-returns";
import AdminPartsLoad from "@/pages/admin/parts-load";
import AdminCustomers from "@/pages/admin/customers";
import DiagnosisList from "@/pages/DiagnosisList";
import QuotesList from "@/pages/QuotesList";

// Admin Utility pages
import AdminUtility from "@/pages/admin/utility/index";
import AdminUtilitySuppliers from "@/pages/admin/utility/suppliers";
import AdminUtilityServices from "@/pages/admin/utility/services";
import AdminUtilityPractices from "@/pages/admin/utility/practices";
import AdminUtilityPracticeDetail from "@/pages/admin/utility/practice-detail";
import AdminUtilityCommissions from "@/pages/admin/utility/commissions";
import AdminUtilityReports from "@/pages/admin/utility/reports";

// Reseller pages
import ResellerDashboard from "@/pages/reseller/dashboard";
import ResellerOrders from "@/pages/reseller/orders";
import ResellerNewRepair from "@/pages/reseller/new-repair";
import ResellerCustomers from "@/pages/reseller/customers";
import ResellerTickets from "@/pages/reseller/tickets";
import ResellerTicketDetail from "@/pages/reseller/ticket-detail";
import ResellerInvoices from "@/pages/reseller/invoices";
import ResellerReports from "@/pages/reseller/reports";

// Reseller Utility pages
import ResellerUtility from "@/pages/reseller/utility/index";
import ResellerUtilitySuppliers from "@/pages/reseller/utility/suppliers";
import ResellerUtilityServices from "@/pages/reseller/utility/services";
import ResellerUtilityPractices from "@/pages/reseller/utility/practices";
import ResellerUtilityPracticeDetail from "@/pages/reseller/utility/practice-detail";
import ResellerUtilityCommissions from "@/pages/reseller/utility/commissions";
import ResellerUtilityReports from "@/pages/reseller/utility/reports";

// Reseller SIFAR pages
import ResellerSifarSettings from "@/pages/reseller/sifar/settings";
import ResellerSifarCatalog from "@/pages/reseller/sifar/catalog";
import ResellerSifarCart from "@/pages/reseller/sifar/cart";

// Reseller Repairs & Inventory
import ResellerRepairs from "@/pages/reseller/repairs";
import ResellerInventory from "@/pages/reseller/inventory";
import ResellerProducts from "@/pages/reseller/products";
import ResellerSuppliers from "@/pages/reseller/suppliers";
import ResellerSupplierOrders from "@/pages/reseller/supplier-orders";
import ResellerSupplierReturns from "@/pages/reseller/supplier-returns";
import ResellerPartsLoad from "@/pages/reseller/parts-load";
import ResellerRepairCenters from "@/pages/reseller/repair-centers";
import ResellerRepairCenterSchedules from "@/pages/reseller/repair-center-schedules";
import ResellerAppointments from "@/pages/reseller/appointments";
import ResellerServiceCatalog from "@/pages/reseller/service-catalog";
import ResellerTeam from "@/pages/reseller/team";
import ResellerDeviceCatalog from "@/pages/reseller/device-catalog";

// Repair Center pages
import RepairCenterDashboard from "@/pages/repair-center/dashboard";
import RepairCenterRepairs from "@/pages/repair-center/repairs";
import RepairCenterInventory from "@/pages/repair-center/inventory";
import RepairCenterTickets from "@/pages/repair-center/tickets";
import RepairCenterTicketDetail from "@/pages/repair-center/ticket-detail";
import RepairCenterAppointments from "@/pages/repair-center/appointments";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerRepairs from "@/pages/customer/repairs";
import CustomerRepairDetail from "@/pages/customer/repair-detail";
import CustomerTickets from "@/pages/customer/tickets";
import CustomerTicketDetail from "@/pages/customer/ticket-detail";
import CustomerInvoices from "@/pages/customer/invoices";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Shared routes (all roles) */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/customers" component={AdminCustomers} />
      <ProtectedRoute path="/admin/resellers" component={AdminResellers} />
      <ProtectedRoute path="/admin/repair-centers" component={AdminRepairCenters} />
      <ProtectedRoute path="/admin/repairs" component={AdminRepairs} />
      <ProtectedRoute path="/admin/tickets" component={AdminTickets} />
      <ProtectedRoute path="/admin/tickets/:id" component={AdminTicketDetail} />
      <ProtectedRoute path="/admin/inventory" component={AdminInventory} />
      <ProtectedRoute path="/admin/products" component={AdminProducts} />
      <ProtectedRoute path="/admin/parts-orders" component={AdminPartsOrders} />
      <ProtectedRoute path="/admin/invoices" component={AdminInvoices} />
      <ProtectedRoute path="/admin/reports" component={AdminReports} />
      <ProtectedRoute path="/admin/chat" component={AdminChat} />
      <ProtectedRoute path="/admin/activity-logs" component={AdminActivityLogs} />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} />
      <ProtectedRoute path="/admin/diagnostics" component={DiagnosisList} />
      <ProtectedRoute path="/admin/quotes" component={QuotesList} />
      <ProtectedRoute path="/admin/suppliers" component={AdminSuppliers} />
      <ProtectedRoute path="/admin/supplier-orders" component={AdminSupplierOrders} />
      <ProtectedRoute path="/admin/supplier-returns" component={AdminSupplierReturns} />
      <ProtectedRoute path="/admin/parts-load" component={AdminPartsLoad} />
      <ProtectedRoute path="/admin/utility" component={AdminUtility} />
      <ProtectedRoute path="/admin/utility/suppliers" component={AdminUtilitySuppliers} />
      <ProtectedRoute path="/admin/utility/services" component={AdminUtilityServices} />
      <ProtectedRoute path="/admin/utility/practices/:id" component={AdminUtilityPracticeDetail} />
      <ProtectedRoute path="/admin/utility/practices" component={AdminUtilityPractices} />
      <ProtectedRoute path="/admin/utility/commissions" component={AdminUtilityCommissions} />
      <ProtectedRoute path="/admin/utility/reports" component={AdminUtilityReports} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <ProtectedRoute path="/admin/service-catalog" component={AdminServiceCatalog} />
      
      {/* Reseller routes */}
      <ProtectedRoute path="/reseller" component={ResellerDashboard} />
      <ProtectedRoute path="/reseller/orders" component={ResellerOrders} />
      <ProtectedRoute path="/reseller/customers" component={ResellerCustomers} />
      <ProtectedRoute path="/reseller/repair-centers" component={ResellerRepairCenters} />
      <ProtectedRoute path="/reseller/repair-center-schedules" component={ResellerRepairCenterSchedules} />
      <ProtectedRoute path="/reseller/appointments" component={ResellerAppointments} />
      <ProtectedRoute path="/reseller/new-repair" component={ResellerNewRepair} />
      <ProtectedRoute path="/reseller/repairs" component={ResellerRepairs} />
      <ProtectedRoute path="/reseller/diagnostics" component={DiagnosisList} />
      <ProtectedRoute path="/reseller/quotes" component={QuotesList} />
      <ProtectedRoute path="/reseller/service-catalog" component={ResellerServiceCatalog} />
      <ProtectedRoute path="/reseller/inventory" component={ResellerInventory} />
      <ProtectedRoute path="/reseller/products" component={ResellerProducts} />
      <ProtectedRoute path="/reseller/suppliers" component={ResellerSuppliers} />
      <ProtectedRoute path="/reseller/supplier-orders" component={ResellerSupplierOrders} />
      <ProtectedRoute path="/reseller/supplier-returns" component={ResellerSupplierReturns} />
      <ProtectedRoute path="/reseller/parts-load" component={ResellerPartsLoad} />
      <ProtectedRoute path="/reseller/tickets" component={ResellerTickets} />
      <ProtectedRoute path="/reseller/tickets/:id" component={ResellerTicketDetail} />
      <ProtectedRoute path="/reseller/utility" component={ResellerUtility} />
      <ProtectedRoute path="/reseller/utility/suppliers" component={ResellerUtilitySuppliers} />
      <ProtectedRoute path="/reseller/utility/services" component={ResellerUtilityServices} />
      <ProtectedRoute path="/reseller/utility/practices/:id" component={ResellerUtilityPracticeDetail} />
      <ProtectedRoute path="/reseller/utility/practices" component={ResellerUtilityPractices} />
      <ProtectedRoute path="/reseller/utility/commissions" component={ResellerUtilityCommissions} />
      <ProtectedRoute path="/reseller/utility/reports" component={ResellerUtilityReports} />
      <ProtectedRoute path="/reseller/invoices" component={ResellerInvoices} />
      <ProtectedRoute path="/reseller/reports" component={ResellerReports} />
      <ProtectedRoute path="/reseller/sifar/settings" component={ResellerSifarSettings} />
      <ProtectedRoute path="/reseller/sifar/catalog" component={ResellerSifarCatalog} />
      <ProtectedRoute path="/reseller/sifar/cart" component={ResellerSifarCart} />
      <ProtectedRoute path="/reseller/team" component={ResellerTeam} />
      <ProtectedRoute path="/reseller/device-catalog" component={ResellerDeviceCatalog} />
      
      {/* Repair Center routes */}
      <ProtectedRoute path="/repair-center" component={RepairCenterDashboard} />
      <ProtectedRoute path="/repair-center/repairs" component={RepairCenterRepairs} />
      <ProtectedRoute path="/repair-center/appointments" component={RepairCenterAppointments} />
      <ProtectedRoute path="/repair-center/inventory" component={RepairCenterInventory} />
      <ProtectedRoute path="/repair-center/tickets" component={RepairCenterTickets} />
      <ProtectedRoute path="/repair-center/tickets/:id" component={RepairCenterTicketDetail} />
      <ProtectedRoute path="/repair-center/diagnostics" component={DiagnosisList} />
      <ProtectedRoute path="/repair-center/quotes" component={QuotesList} />
      
      {/* Customer routes */}
      <ProtectedRoute path="/customer" component={CustomerDashboard} />
      <ProtectedRoute path="/customer/repairs" component={CustomerRepairs} />
      <ProtectedRoute path="/customer/repairs/:id" component={CustomerRepairDetail} />
      <ProtectedRoute path="/customer/tickets" component={CustomerTickets} />
      <ProtectedRoute path="/customer/tickets/:id" component={CustomerTicketDetail} />
      <ProtectedRoute path="/customer/invoices" component={CustomerInvoices} />
      
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
      <TooltipProvider>
        <AuthProvider>
          <TicketNotificationsProvider>
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
          </TicketNotificationsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
