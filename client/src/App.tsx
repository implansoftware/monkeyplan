import { useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useLicenseStatus } from "@/hooks/use-license-status";
import { LicenseBlockPage, LicenseExpiringBanner } from "@/components/license-block";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { TicketNotificationsProvider } from "@/contexts/TicketNotificationsContext";
import { Loader2 } from "lucide-react";
import LandingPage, { Navbar as PublicNavbar } from "@/pages/public/landing";
import AboutPage from "@/pages/public/about";
import ContactPage from "@/pages/public/contact";
import FaqPage from "@/pages/public/faq";
import TermsPage from "@/pages/public/terms";
import PrivacyPage from "@/pages/public/privacy";

function HomePage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!user) {
    return <LandingPage />;
  }
  
  switch (user.role) {
    case "admin":
    case "admin_staff":
      return <AdminDashboard />;
    case "reseller":
    case "reseller_staff":
      return <Redirect to="/reseller" />;
    case "repair_center":
    case "repair_center_staff":
      return <Redirect to="/repair-center" />;
    case "customer":
      return <Redirect to="/customer" />;
    default:
      return <Redirect to="/auth" />;
  }
}

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminResellers from "@/pages/admin/resellers";
import AdminResellerTeam from "@/pages/admin/reseller-team";
import AdminResellerTeams from "@/pages/admin/reseller-teams";
import AdminResellerDetail from "@/pages/admin/reseller-detail";
import AdminRepairCenters from "@/pages/admin/repair-centers";
import AdminRepairCenterDetail from "@/pages/admin/repair-center-detail";
import AdminTickets from "@/pages/admin/tickets";
import AdminTicketDetail from "@/pages/admin/ticket-detail";
import AdminRepairs from "@/pages/admin/repairs";
import AdminProducts from "@/pages/admin/products";
import AdminProductAssignments from "@/pages/admin/product-assignments";
import AdminPartsOrders from "@/pages/admin/parts-orders";
import AdminInvoices from "@/pages/admin/invoices";
import AdminReports from "@/pages/admin/reports";
import AdminChat from "@/pages/admin/chat";
import AdminActivityLogs from "@/pages/admin/activity-logs";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";
import AdminDiagnosisSettings from "@/pages/admin/diagnosis-settings";
import AdminServiceCatalog from "@/pages/admin/service-catalog";
import AdminSuppliers from "@/pages/admin/suppliers";
import AdminSupplierOrders from "@/pages/admin/supplier-orders";
import AdminSupplierReturns from "@/pages/admin/supplier-returns";
import AdminTransferRequests from "@/pages/admin/transfer-requests";
import AdminTransferRequestsOverview from "@/pages/admin/transfer-requests-overview";
import AdminExternalIntegrations from "@/pages/admin/external-integrations";
import AdminCustomers from "@/pages/admin/customers";
import AdminCustomerDetail from "@/pages/admin/customer-detail";
import AdminRepairDetail from "@/pages/admin/repair-detail";
import AdminTeam from "@/pages/admin/team";
import AdminSmartphoneCatalog from "@/pages/admin/smartphone-catalog";
import AdminAccessoryCatalog from "@/pages/admin/accessory-catalog";
import AdminDeviceCatalog from "@/pages/admin/device-catalog";
import AdminPriceLists from "@/pages/admin/price-lists";
import AdminPriceListDetail from "@/pages/admin/price-list-detail";
import AdminDeviceCompatibilities from "@/pages/admin/device-compatibilities";
import AdminUtilityCategories from "@/pages/admin/utility-categories";
import AdminSalesOrders from "@/pages/admin/sales-orders";
import AdminShipments from "@/pages/admin/shipments";
import AdminPayments from "@/pages/admin/payments";
import DiagnosisList from "@/pages/DiagnosisList";
import QuotesList from "@/pages/QuotesList";
import AdminWarehouses from "@/pages/admin/warehouses";
import AdminAllWarehouses from "@/pages/admin/all-warehouses";
import AdminWarrantyProducts from "@/pages/admin/warranty-products";
import AdminWarrantyAnalytics from "@/pages/admin/warranty-analytics";
import AdminServiceOrders from "@/pages/admin/service-orders";
import AdminUnrepairableReasons from "@/pages/admin/unrepairable-reasons";
import AdminLicensePlans from "@/pages/admin/license-plans";
import AdminLicenses from "@/pages/admin/licenses";
import MyLicense from "@/pages/my-license";

// Admin Utility pages
import AdminUtility from "@/pages/admin/utility/index";
import AdminUtilitySuppliers from "@/pages/admin/utility/suppliers";
import AdminUtilityServices from "@/pages/admin/utility/services";
import AdminUtilityPractices from "@/pages/admin/utility/practices";
import AdminUtilityPracticeDetail from "@/pages/admin/utility/practice-detail";
import AdminUtilityCommissions from "@/pages/admin/utility/commissions";
import AdminUtilityReports from "@/pages/admin/utility/reports";
import AdminPosOverview from "@/pages/admin/pos-overview";

// Reseller pages
import ResellerDashboard from "@/pages/reseller/dashboard";
import ResellerOrders from "@/pages/reseller/orders";
import ResellerNewRepair from "@/pages/reseller/new-repair";
import ResellerCustomers from "@/pages/reseller/customers";
import ResellerCustomerDetail from "@/pages/reseller/customer-detail";
import ResellerTickets from "@/pages/reseller/tickets";
import ResellerTicketDetail from "@/pages/reseller/ticket-detail";
import ResellerNotifications from "@/pages/reseller/notifications";
import ResellerInvoices from "@/pages/reseller/invoices";
import ResellerSales from "@/pages/reseller/sales";
import ResellerReports from "@/pages/reseller/reports";
import ResellerSettings from "@/pages/reseller/settings";

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

// Reseller Foneday pages
import ResellerFonedaySettings from "@/pages/reseller/foneday/settings";
import ResellerFonedayCatalog from "@/pages/reseller/foneday/catalog";
import ResellerFonedayCart from "@/pages/reseller/foneday/cart";

// Reseller MobileSentrix pages
import ResellerMobilesentrixSettings from "@/pages/reseller/mobilesentrix/settings";
import ResellerMobilesentrixCatalog from "@/pages/reseller/mobilesentrix/catalog";
import ResellerMobilesentrixCart from "@/pages/reseller/mobilesentrix/cart";
import ResellerMobilesentrixOrders from "@/pages/reseller/mobilesentrix/orders";

// Reseller TrovaUsati pages
import ResellerTrovausatiSettings from "@/pages/reseller/trovausati/settings";
import ResellerTrovausatiMarketplace from "@/pages/reseller/trovausati/marketplace";
import ResellerTrovausatiValutatore from "@/pages/reseller/trovausati/valutatore";
import ResellerIntegrations from "@/pages/reseller/integrations";

// Reseller Sibill pages
import ResellerSibillSettings from "@/pages/reseller/sibill/settings";

// Reseller Repairs & Inventory
import ResellerRepairs from "@/pages/reseller/repairs";
import ResellerProducts from "@/pages/reseller/products";
import ResellerNetworkWarehouses from "@/pages/reseller/network-warehouses";
import ResellerSuppliers from "@/pages/reseller/suppliers";
import ResellerSupplierOrders from "@/pages/reseller/supplier-orders";
import ResellerSupplierReturns from "@/pages/reseller/supplier-returns";
import ResellerRepairCenters from "@/pages/reseller/repair-centers";
import ResellerRepairCenterSchedules from "@/pages/reseller/repair-center-schedules";
import ResellerAppointments from "@/pages/reseller/appointments";
import ResellerServiceCatalog from "@/pages/reseller/service-catalog";
import ResellerTeam from "@/pages/reseller/team";
import ResellerServiceOrders from "@/pages/reseller/service-orders";
import ResellerSubResellers from "@/pages/reseller/sub-resellers";
import SubResellerServiceCatalog from "@/pages/sub-reseller/service-catalog";
import ResellerDeviceCatalog from "@/pages/reseller/device-catalog";
import ResellerRepairDetail from "@/pages/reseller/repair-detail";
import ResellerSmartphoneCatalog from "@/pages/reseller/smartphone-catalog";
import ResellerAccessoryCatalog from "@/pages/reseller/accessory-catalog";
import ResellerGuide from "@/pages/reseller/guide";
import ResellerPriceLists from "@/pages/reseller/price-lists";
import ResellerPriceListDetail from "@/pages/reseller/price-list-detail";

// Reseller HR pages
import ResellerHrDashboard from "@/pages/reseller/hr/index";
import ResellerHrAttendance from "@/pages/reseller/hr/attendance";
import ResellerHrLeaveRequests from "@/pages/reseller/hr/leave-requests";
import ResellerHrWorkProfiles from "@/pages/reseller/hr/work-profiles";
import ResellerHrExpenses from "@/pages/reseller/hr/expenses";
import ResellerHrSickLeave from "@/pages/reseller/hr/sick-leave";
import ResellerHrCalendar from "@/pages/reseller/hr/calendar";
import ResellerPosOverview from "@/pages/reseller/pos-overview";
import ResellerPosSalesHistory from "@/pages/reseller/pos-sales-history";
import ResellerPosSessions from "@/pages/reseller/pos-sessions";
import ResellerPosTransactionDetail from "@/pages/reseller/pos-transaction-detail";
import ResellerPosRegisters from "@/pages/reseller/pos-registers";
import ResellerPosTerminal from "@/pages/reseller/pos-terminal";
import ResellerPosRegisterSettings from "@/pages/reseller/pos-register-settings";

// Repair Center pages
import RepairCenterDashboard from "@/pages/repair-center/dashboard";
import RepairCenterRepairs from "@/pages/repair-center/repairs";
import RepairCenterTickets from "@/pages/repair-center/tickets";
import RepairCenterTicketDetail from "@/pages/repair-center/ticket-detail";
import RepairCenterAppointments from "@/pages/repair-center/appointments";
import RepairCenterRepairDetail from "@/pages/repair-center/repair-detail";
import RepairCenterWarehouses from "@/pages/repair-center/warehouses";
import RepairCenterProducts from "@/pages/repair-center/products";
import RepairCenterB2BCatalog from "@/pages/repair-center/b2b-catalog";
import RepairCenterB2BOrders from "@/pages/repair-center/b2b-orders";
import RepairCenterSmartphoneCatalog from "@/pages/repair-center/smartphone-catalog";
import RepairCenterAccessoryCatalog from "@/pages/repair-center/accessory-catalog";
import RepairCenterSparePartsCatalog from "@/pages/repair-center/spare-parts-catalog";
import RepairCenterCustomers from "@/pages/repair-center/customers";
import RepairCenterCustomerDetail from "@/pages/repair-center/customer-detail";
import RepairCenterB2BReturns from "@/pages/repair-center/b2b-returns";
import RepairCenterSettings from "@/pages/repair-center/settings";
import RepairCenterMarketplace from "@/pages/repair-center/marketplace";
import RepairCenterUtility from "@/pages/repair-center/utility/index";
import RepairCenterUtilitySuppliers from "@/pages/repair-center/utility/suppliers";
import RepairCenterUtilityServices from "@/pages/repair-center/utility/services";
import RepairCenterServiceCatalog from "@/pages/repair-center/service-catalog";
import RepairCenterServiceOrders from "@/pages/repair-center/service-orders";
import RepairCenterPriceLists from "@/pages/repair-center/price-lists";
import RepairCenterPriceListDetail from "@/pages/repair-center/price-list-detail";
import RepairCenterUtilityPractices from "@/pages/repair-center/utility/practices";
import RepairCenterUtilityPracticeDetail from "@/pages/repair-center/utility/practice-detail";
import RepairCenterUtilityCommissions from "@/pages/repair-center/utility/commissions";
import RepairCenterUtilityReports from "@/pages/repair-center/utility/reports";
import RepairCenterTransferRequests from "@/pages/repair-center/transfer-requests";
import RepairCenterTransferRequestsOverview from "@/pages/repair-center/transfer-requests-overview";
import RepairCenterRemoteRequests from "@/pages/repair-center/remote-requests";
import RepairCenterCart from "@/pages/repair-center/cart";
import RepairCenterTeam from "@/pages/repair-center/team";
import RepairCenterSuppliers from "@/pages/repair-center/suppliers";
import RepairCenterSupplierOrders from "@/pages/repair-center/supplier-orders";
import RepairCenterPos from "@/pages/repair-center/pos";
import PosTransactionDetail from "@/pages/repair-center/pos-transaction-detail";
import SalesHistory from "@/pages/repair-center/pos-invoices";
import PosSessions from "@/pages/repair-center/pos-sessions";
import PosRegisters from "@/pages/repair-center/pos-registers";
import PosRegisterSettings from "@/pages/repair-center/pos-register-settings";
import RepairCenterInvoices from "@/pages/repair-center/invoices";

// Repair Center HR pages
import RepairCenterHrDashboard from "@/pages/repair-center/hr/index";
import RepairCenterHrAttendance from "@/pages/repair-center/hr/attendance";
import RepairCenterHrLeaveRequests from "@/pages/repair-center/hr/leave-requests";
import RepairCenterHrWorkProfiles from "@/pages/repair-center/hr/work-profiles";
import RepairCenterHrExpenses from "@/pages/repair-center/hr/expenses";
import RepairCenterHrSickLeave from "@/pages/repair-center/hr/sick-leave";
import RepairCenterHrCalendar from "@/pages/repair-center/hr/calendar";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerRepairs from "@/pages/customer/repairs";
import CustomerRepairDetail from "@/pages/customer/repair-detail";
import CustomerTickets from "@/pages/customer/tickets";
import CustomerTicketDetail from "@/pages/customer/ticket-detail";
import CustomerInvoices from "@/pages/customer/invoices";
import CustomerWarranties from "@/pages/customer/warranties";
import CustomerOrders from "@/pages/customer/orders";
import CustomerOrderDetail from "@/pages/customer/order-detail";
import CustomerSalesReturns from "@/pages/customer/sales-returns";
import CustomerProfile from "@/pages/customer/profile";
import CustomerRemoteRequests from "@/pages/customer/remote-requests";
import CustomerServiceCatalog from "@/pages/customer/service-catalog";
import CustomerServiceOrders from "@/pages/customer/service-orders";

// Shop pages (public)
import ShopCatalog from "@/pages/shop/catalog";
import ShopCart from "@/pages/shop/cart";
import ShopCheckout from "@/pages/shop/checkout";
import ShopMarketplace from "@/pages/shop/marketplace";
import MarketplaceProductDetail from "@/pages/shop/marketplace-product-detail";
import ShopAdminProductDetail from "@/pages/shop/admin/product-detail";

// Public pages (no auth required)
import PublicTrack from "@/pages/public/track";
import RepairLink from "@/pages/public/repair-link";

// Reseller sales orders, shipments, payments and returns
import ResellerSalesOrders from "@/pages/reseller/sales-orders";
import ResellerShopCatalog from "@/pages/reseller/shop-catalog";
import ResellerShipments from "@/pages/reseller/shipments";
import ResellerPayments from "@/pages/reseller/payments";
import ResellerSalesReturns from "@/pages/reseller/sales-returns";

// B2B ordering
import ResellerB2BCatalog from "@/pages/reseller/b2b-catalog";
import ResellerB2BOrders from "@/pages/reseller/b2b-orders";
import ResellerB2BReturns from "@/pages/reseller/b2b-returns";
import ResellerRCB2BOrders from "@/pages/reseller/rc-b2b-orders";
import AdminB2BOrders from "@/pages/admin/b2b-orders";
import AdminRCB2BOrders from "@/pages/admin/rc-b2b-orders";
import AdminB2BReturns from "@/pages/admin/b2b-returns";
import AdminRemoteRequests from "@/pages/admin/remote-requests";
import AdminHRLeaveRequests from "@/pages/admin/hr/leave-requests";
import AdminHRSickLeave from "@/pages/admin/hr/sick-leave";
import AdminHRExpenses from "@/pages/admin/hr/expenses";
import AdminHRAttendance from "@/pages/admin/hr/attendance";
import AdminHRCalendar from "@/pages/admin/hr/calendar";

// Reseller Marketplace (peer-to-peer)
import ResellerMarketplace from "@/pages/reseller/marketplace";
import ResellerMarketplaceOrders from "@/pages/reseller/marketplace-orders";
import ResellerMarketplaceSales from "@/pages/reseller/marketplace-sales";
import ResellerRemoteRequests from "@/pages/reseller/remote-requests";

// Transfer requests
import SubResellerTransferRequests from "@/pages/reseller/sub-reseller-transfer-requests";
import IncomingTransferRequests from "@/pages/reseller/incoming-transfer-requests";
import TransferRequests from "@/pages/reseller/transfer-requests";
import ResellerWarrantyProducts from "@/pages/reseller/warranty-products";
import ResellerWarrantyAnalytics from "@/pages/reseller/warranty-analytics";
import RepairCenterWarrantyAnalytics from "@/pages/repair-center/warranty-analytics";
import PosPaymentSuccess from "@/pages/pos-payment-success";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/pos-payment-success" component={PosPaymentSuccess} />
      
      {/* Shared routes (all roles) */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Home route - redirects based on user role */}
      <Route path="/" component={HomePage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/customers/:id" component={AdminCustomerDetail} />
      <ProtectedRoute path="/admin/customers" component={AdminCustomers} />
      <ProtectedRoute path="/admin/reseller-teams" component={AdminResellerTeams} />
      <ProtectedRoute path="/admin/resellers/:resellerId/team" component={AdminResellerTeam} />
      <ProtectedRoute path="/admin/resellers/:id" component={AdminResellerDetail} />
      <ProtectedRoute path="/admin/resellers" component={AdminResellers} />
      <ProtectedRoute path="/admin/repair-centers/:id" component={AdminRepairCenterDetail} />
      <ProtectedRoute path="/admin/repair-centers" component={AdminRepairCenters} />
      <ProtectedRoute path="/admin/repairs/:id" component={AdminRepairDetail} />
      <ProtectedRoute path="/admin/repairs" component={AdminRepairs} />
      <ProtectedRoute path="/admin/tickets" component={AdminTickets} />
      <ProtectedRoute path="/admin/tickets/:id" component={AdminTicketDetail} />
      <ProtectedRoute path="/admin/warehouses" component={AdminWarehouses} />
      <ProtectedRoute path="/admin/all-warehouses" component={AdminAllWarehouses} />
      <ProtectedRoute path="/admin/products" component={AdminProducts} />
      <ProtectedRoute path="/admin/product-assignments" component={AdminProductAssignments} />
      <ProtectedRoute path="/admin/parts-orders" component={AdminPartsOrders} />
      <ProtectedRoute path="/admin/invoices" component={AdminInvoices} />
      <ProtectedRoute path="/admin/sales-orders" component={AdminSalesOrders} />
      <ProtectedRoute path="/admin/shipments" component={AdminShipments} />
      <ProtectedRoute path="/admin/payments" component={AdminPayments} />
      <ProtectedRoute path="/admin/sales-returns" component={ResellerSalesReturns} />
      <ProtectedRoute path="/admin/reports" component={AdminReports} />
      <ProtectedRoute path="/admin/chat" component={AdminChat} />
      <ProtectedRoute path="/admin/activity-logs" component={AdminActivityLogs} />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} />
      <ProtectedRoute path="/admin/diagnostics" component={DiagnosisList} />
      <ProtectedRoute path="/admin/quotes" component={QuotesList} />
      <ProtectedRoute path="/admin/suppliers" component={AdminSuppliers} />
      <ProtectedRoute path="/admin/supplier-orders" component={AdminSupplierOrders} />
      <ProtectedRoute path="/admin/supplier-returns" component={AdminSupplierReturns} />
      <ProtectedRoute path="/admin/transfer-requests/overview" component={AdminTransferRequestsOverview} />
      <ProtectedRoute path="/admin/transfer-requests" component={AdminTransferRequests} />
      <ProtectedRoute path="/admin/external-integrations" component={AdminExternalIntegrations} />
      <ProtectedRoute path="/admin/utility" component={AdminUtility} />
      <ProtectedRoute path="/admin/utility/suppliers" component={AdminUtilitySuppliers} />
      <ProtectedRoute path="/admin/utility/services" component={AdminUtilityServices} />
      <ProtectedRoute path="/admin/utility/practices/:id" component={AdminUtilityPracticeDetail} />
      <ProtectedRoute path="/admin/utility/practices" component={AdminUtilityPractices} />
      <ProtectedRoute path="/admin/utility/commissions" component={AdminUtilityCommissions} />
      <ProtectedRoute path="/admin/utility/reports" component={AdminUtilityReports} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <ProtectedRoute path="/admin/diagnosis-settings" component={AdminDiagnosisSettings} />
      <ProtectedRoute path="/admin/unrepairable-reasons" component={AdminUnrepairableReasons} />
      <ProtectedRoute path="/admin/service-catalog" component={AdminServiceCatalog} />
      <ProtectedRoute path="/admin/dispositivi" component={AdminSmartphoneCatalog} />
      <ProtectedRoute path="/admin/accessory-catalog" component={AdminAccessoryCatalog} />
      <ProtectedRoute path="/admin/device-catalog" component={AdminDeviceCatalog} />
      <ProtectedRoute path="/admin/price-lists" component={AdminPriceLists} />
      <ProtectedRoute path="/admin/price-lists/:id" component={AdminPriceListDetail} />
      <ProtectedRoute path="/admin/device-compatibilities" component={AdminDeviceCompatibilities} />
      <ProtectedRoute path="/admin/utility-categories" component={AdminUtilityCategories} />
      <ProtectedRoute path="/admin/team" component={AdminTeam} />
      <ProtectedRoute path="/admin/b2b-orders" component={AdminB2BOrders} />
      <ProtectedRoute path="/admin/rc-b2b-orders" component={AdminRCB2BOrders} />
      <ProtectedRoute path="/admin/b2b-returns" component={AdminB2BReturns} />
      <ProtectedRoute path="/admin/remote-requests" component={AdminRemoteRequests} />
      <ProtectedRoute path="/admin/hr/leave-requests" component={AdminHRLeaveRequests} />
      <ProtectedRoute path="/admin/hr/sick-leave" component={AdminHRSickLeave} />
      <ProtectedRoute path="/admin/hr/expenses" component={AdminHRExpenses} />
      <ProtectedRoute path="/admin/hr/attendance" component={AdminHRAttendance} />
      <ProtectedRoute path="/admin/hr/calendar" component={AdminHRCalendar} />
      <ProtectedRoute path="/admin/pos" component={AdminPosOverview} />
      <ProtectedRoute path="/admin/warranty-products" component={AdminWarrantyProducts} />
      <ProtectedRoute path="/admin/warranty-analytics" component={AdminWarrantyAnalytics} />
      <ProtectedRoute path="/admin/service-orders" component={AdminServiceOrders} />
      <ProtectedRoute path="/admin/license-plans" component={AdminLicensePlans} />
      <ProtectedRoute path="/admin/licenses" component={AdminLicenses} />
      
      {/* Reseller routes - accessible by reseller and reseller_staff */}
      <ProtectedRoute path="/reseller" component={ResellerDashboard} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/orders" component={ResellerOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/customers/:id" component={ResellerCustomerDetail} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/customers" component={ResellerCustomers} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/repair-centers" component={ResellerRepairCenters} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/repair-center-schedules" component={ResellerRepairCenterSchedules} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/appointments" component={ResellerAppointments} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/new-repair" component={ResellerNewRepair} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/repairs/:id" component={ResellerRepairDetail} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/repairs" component={ResellerRepairs} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/diagnostics" component={DiagnosisList} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/quotes" component={QuotesList} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/service-catalog" component={ResellerServiceCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/price-lists/:id" component={ResellerPriceListDetail} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/price-lists" component={ResellerPriceLists} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/warehouses" component={AdminWarehouses} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/network-warehouses" component={ResellerNetworkWarehouses} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/service-orders" component={ResellerServiceOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/products" component={ResellerProducts} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/suppliers" component={ResellerSuppliers} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/supplier-orders" component={ResellerSupplierOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/supplier-returns" component={ResellerSupplierReturns} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/tickets" component={ResellerTickets} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/tickets/:id" component={ResellerTicketDetail} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/notifications" component={ResellerNotifications} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/guide" component={ResellerGuide} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos" component={ResellerPosOverview} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos/sales-history" component={ResellerPosSalesHistory} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos/sessions" component={ResellerPosSessions} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos/registers" component={ResellerPosRegisters} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos/registers/:id/settings" component={ResellerPosRegisterSettings} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos/terminal/:repairCenterId/:registerId" component={ResellerPosTerminal} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/pos/transaction/:id" component={ResellerPosTransactionDetail} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility" component={ResellerUtility} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility/suppliers" component={ResellerUtilitySuppliers} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility/services" component={ResellerUtilityServices} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility/practices/:id" component={ResellerUtilityPracticeDetail} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility/practices" component={ResellerUtilityPractices} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility/commissions" component={ResellerUtilityCommissions} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/utility/reports" component={ResellerUtilityReports} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/invoices" component={ResellerInvoices} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sales" component={ResellerSales} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/warranty-products" component={ResellerWarrantyProducts} allowedRoles={["reseller"]} />
      <ProtectedRoute path="/reseller/reports" component={ResellerReports} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/warranty-analytics" component={ResellerWarrantyAnalytics} allowedRoles={["reseller", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sifar/settings" component={ResellerSifarSettings} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sifar/catalog" component={ResellerSifarCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sifar/cart" component={ResellerSifarCart} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/foneday/settings" component={ResellerFonedaySettings} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/foneday/catalog" component={ResellerFonedayCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/foneday/cart" component={ResellerFonedayCart} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/mobilesentrix/settings" component={ResellerMobilesentrixSettings} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/mobilesentrix/catalog" component={ResellerMobilesentrixCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/mobilesentrix/cart" component={ResellerMobilesentrixCart} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/mobilesentrix/orders" component={ResellerMobilesentrixOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/trovausati/settings" component={ResellerTrovausatiSettings} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/trovausati/marketplace" component={ResellerTrovausatiMarketplace} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/trovausati/valutatore" component={ResellerTrovausatiValutatore} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sibill/settings" component={ResellerSibillSettings} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/integrations" component={ResellerIntegrations} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/team" component={ResellerTeam} allowedRoles={["reseller"]} />
      <ProtectedRoute path="/reseller/sub-resellers" component={ResellerSubResellers} allowedRoles={["reseller"]} />
      <ProtectedRoute path="/sub-reseller/service-catalog" component={SubResellerServiceCatalog} allowedRoles={["sub_reseller"]} />
      <ProtectedRoute path="/reseller/device-catalog" component={ResellerDeviceCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/dispositivi" component={ResellerSmartphoneCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/accessory-catalog" component={ResellerAccessoryCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/shop-catalog" component={ResellerShopCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sales-orders/:id" component={ResellerSalesOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sales-orders" component={ResellerSalesOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/shipments/:id" component={ResellerShipments} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/shipments" component={ResellerShipments} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/payments" component={ResellerPayments} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sales-returns" component={ResellerSalesReturns} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/b2b-catalog" component={ResellerB2BCatalog} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/b2b-orders" component={ResellerB2BOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/b2b-returns" component={ResellerB2BReturns} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/rc-b2b-orders" component={ResellerRCB2BOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/marketplace" component={ResellerMarketplace} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/marketplace-orders" component={ResellerMarketplaceOrders} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/marketplace-sales" component={ResellerMarketplaceSales} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/remote-requests" component={ResellerRemoteRequests} allowedRoles={["reseller", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/sub-transfer-requests" component={SubResellerTransferRequests} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/incoming-transfer-requests" component={IncomingTransferRequests} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/transfer-requests" component={TransferRequests} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      
      {/* Reseller HR routes */}
      <ProtectedRoute path="/reseller/hr/attendance" component={ResellerHrAttendance} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/hr/leave-requests" component={ResellerHrLeaveRequests} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/hr/work-profiles" component={ResellerHrWorkProfiles} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/hr/expenses" component={ResellerHrExpenses} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/hr/sick-leave" component={ResellerHrSickLeave} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/hr/calendar" component={ResellerHrCalendar} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/hr" component={ResellerHrDashboard} allowedRoles={["reseller", "reseller_staff", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/settings" component={ResellerSettings} allowedRoles={["reseller", "sub_reseller"]} />
      <ProtectedRoute path="/reseller/my-license" component={MyLicense} allowedRoles={["reseller"]} />
      
      {/* Repair Center routes */}
      <ProtectedRoute path="/repair-center" component={RepairCenterDashboard} />
      <ProtectedRoute path="/repair-center/repairs/:id" component={RepairCenterRepairDetail} />
      <ProtectedRoute path="/repair-center/repairs" component={RepairCenterRepairs} />
      <ProtectedRoute path="/repair-center/appointments" component={RepairCenterAppointments} />
      <ProtectedRoute path="/repair-center/warehouses" component={RepairCenterWarehouses} />
      <ProtectedRoute path="/repair-center/products" component={RepairCenterProducts} />
      <ProtectedRoute path="/repair-center/b2b-catalog" component={RepairCenterB2BCatalog} />
      <ProtectedRoute path="/repair-center/b2b-orders" component={RepairCenterB2BOrders} />
      <ProtectedRoute path="/repair-center/cart" component={RepairCenterCart} />
      <ProtectedRoute path="/repair-center/dispositivi" component={RepairCenterSmartphoneCatalog} />
      <ProtectedRoute path="/repair-center/accessory-catalog" component={RepairCenterAccessoryCatalog} />
      <ProtectedRoute path="/repair-center/spare-parts-catalog" component={RepairCenterSparePartsCatalog} />
      <ProtectedRoute path="/repair-center/customers/:id" component={RepairCenterCustomerDetail} />
      <ProtectedRoute path="/repair-center/customers" component={RepairCenterCustomers} />
      <ProtectedRoute path="/repair-center/service-catalog" component={RepairCenterServiceCatalog} />
      <ProtectedRoute path="/repair-center/service-orders" component={RepairCenterServiceOrders} />
      <ProtectedRoute path="/repair-center/price-lists/:id" component={RepairCenterPriceListDetail} />
      <ProtectedRoute path="/repair-center/price-lists" component={RepairCenterPriceLists} />
      <ProtectedRoute path="/repair-center/settings" component={RepairCenterSettings} />
      <ProtectedRoute path="/repair-center/invoices" component={RepairCenterInvoices} />
      <ProtectedRoute path="/repair-center/b2b-returns" component={RepairCenterB2BReturns} />
      <ProtectedRoute path="/repair-center/warranty-analytics" component={RepairCenterWarrantyAnalytics} allowedRoles={["repair_center", "repair_center_staff"]} />
      <ProtectedRoute path="/repair-center/marketplace" component={RepairCenterMarketplace} />
      <ProtectedRoute path="/repair-center/suppliers" component={RepairCenterSuppliers} />
      <ProtectedRoute path="/repair-center/supplier-orders" component={RepairCenterSupplierOrders} />
      <ProtectedRoute path="/repair-center/tickets" component={RepairCenterTickets} />
      <ProtectedRoute path="/repair-center/tickets/:id" component={RepairCenterTicketDetail} />
      <ProtectedRoute path="/repair-center/utility" component={RepairCenterUtility} />
      <ProtectedRoute path="/repair-center/utility/suppliers" component={RepairCenterUtilitySuppliers} />
      <ProtectedRoute path="/repair-center/utility/services" component={RepairCenterUtilityServices} />
      <ProtectedRoute path="/repair-center/utility/practices/:id" component={RepairCenterUtilityPracticeDetail} />
      <ProtectedRoute path="/repair-center/utility/practices" component={RepairCenterUtilityPractices} />
      <ProtectedRoute path="/repair-center/utility/commissions" component={RepairCenterUtilityCommissions} />
      <ProtectedRoute path="/repair-center/utility/reports" component={RepairCenterUtilityReports} />
      <ProtectedRoute path="/repair-center/team" component={RepairCenterTeam} allowedRoles={["repair_center"]} />
      <ProtectedRoute path="/repair-center/hr/attendance" component={RepairCenterHrAttendance} />
      <ProtectedRoute path="/repair-center/hr/leave-requests" component={RepairCenterHrLeaveRequests} />
      <ProtectedRoute path="/repair-center/hr/work-profiles" component={RepairCenterHrWorkProfiles} />
      <ProtectedRoute path="/repair-center/hr/expenses" component={RepairCenterHrExpenses} />
      <ProtectedRoute path="/repair-center/hr/sick-leave" component={RepairCenterHrSickLeave} />
      <ProtectedRoute path="/repair-center/hr/calendar" component={RepairCenterHrCalendar} />
      <ProtectedRoute path="/repair-center/hr" component={RepairCenterHrDashboard} />
      <ProtectedRoute path="/repair-center/transfer-requests/overview" component={RepairCenterTransferRequestsOverview} />
      <ProtectedRoute path="/repair-center/transfer-requests" component={RepairCenterTransferRequests} />
      <ProtectedRoute path="/repair-center/remote-requests" component={RepairCenterRemoteRequests} />
      <ProtectedRoute path="/repair-center/diagnostics" component={DiagnosisList} />
      <ProtectedRoute path="/repair-center/quotes" component={QuotesList} />
      <ProtectedRoute path="/repair-center/pos" component={RepairCenterPos} />
      <ProtectedRoute path="/repair-center/pos/sales-history" component={SalesHistory} />
      <ProtectedRoute path="/repair-center/pos/sessions" component={PosSessions} />
      <ProtectedRoute path="/repair-center/pos/registers" component={PosRegisters} />
      <ProtectedRoute path="/repair-center/pos/registers/:id/settings" component={PosRegisterSettings} />
      <ProtectedRoute path="/repair-center/pos/transaction/:id" component={PosTransactionDetail} />
      
      {/* Customer routes */}
      <ProtectedRoute path="/customer" component={CustomerDashboard} />
      <ProtectedRoute path="/customer/repairs" component={CustomerRepairs} />
      <ProtectedRoute path="/customer/repairs/:id" component={CustomerRepairDetail} />
      <ProtectedRoute path="/customer/warranties" component={CustomerWarranties} allowedRoles={["customer"]} />
      <ProtectedRoute path="/customer/tickets" component={CustomerTickets} />
      <ProtectedRoute path="/customer/tickets/:id" component={CustomerTicketDetail} />
      <ProtectedRoute path="/customer/invoices" component={CustomerInvoices} />
      <ProtectedRoute path="/customer/orders/:id" component={CustomerOrderDetail} />
      <ProtectedRoute path="/customer/orders" component={CustomerOrders} />
      <ProtectedRoute path="/customer/sales-returns" component={CustomerSalesReturns} />
      <ProtectedRoute path="/customer/profile" component={CustomerProfile} />
      <ProtectedRoute path="/customer/remote-requests" component={CustomerRemoteRequests} />
      <ProtectedRoute path="/customer/service-catalog" component={CustomerServiceCatalog} />
      <ProtectedRoute path="/customer/service-orders" component={CustomerServiceOrders} />
      
      {/* Shop admin routes */}
      <ProtectedRoute path="/shop/admin/products/:id" component={ShopAdminProductDetail} />
      
      {/* Shop routes (public) */}
      <Route path="/marketplace/:productId" component={MarketplaceProductDetail} />
      <Route path="/marketplace" component={ShopMarketplace} />
      <Route path="/shop/:resellerId/products/:productId" component={MarketplaceProductDetail} />
      <Route path="/shop/:resellerId" component={ShopCatalog} />
      <Route path="/shop/:resellerId/cart" component={ShopCart} />
      <ProtectedRoute path="/shop/:resellerId/checkout" component={ShopCheckout} />
      
      {/* Public pages */}
      <Route path="/track/:orderNumber" component={PublicTrack} />
      <Route path="/repair-link/:id" component={RepairLink} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  const [location] = useLocation();
  const { hasActiveLicense, isExpiringSoon, daysRemaining, isReseller, isLoading: licenseLoading } = useLicenseStatus();

  const isLicensePage = location === "/reseller/my-license";
  const showBlock = isReseller && !licenseLoading && !hasActiveLicense && !isLicensePage;
  const showBanner = isReseller && !licenseLoading && hasActiveLicense && isExpiringSoon && daysRemaining !== null;

  return (
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
            {showBanner && (
              <div className="px-4 pt-3">
                <LicenseExpiringBanner daysRemaining={daysRemaining!} />
              </div>
            )}
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                {showBlock ? <LicenseBlockPage /> : <Router />}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TicketNotificationsProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function ShopRouter() {
  return (
    <>
      <PublicNavbar solid showLandingLinks={false} />
      <ScrollToTop />
      <div className="pt-16">
        <Switch>
          <Route path="/marketplace/:productId" component={MarketplaceProductDetail} />
          <Route path="/marketplace" component={ShopMarketplace} />
          <Route path="/shop/:resellerId/products/:productId" component={MarketplaceProductDetail} />
          <Route path="/shop/:resellerId/cart" component={ShopCart} />
          <ProtectedRoute path="/shop/:resellerId/checkout" component={ShopCheckout} />
          <Route path="/shop/:resellerId" component={ShopCatalog} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Auth page renders without sidebar/header
  if (location === "/auth") {
    return <AuthPage />;
  }
  
  // Landing page renders fullscreen without sidebar
  if (location === "/" && !user && !isLoading) {
    return <LandingPage />;
  }
  if (location === "/landing") {
    return <LandingPage />;
  }

  const publicPages: Record<string, React.ComponentType> = {
    "/about": AboutPage,
    "/contact": ContactPage,
    "/faq": FaqPage,
    "/terms": TermsPage,
    "/privacy": PrivacyPage,
  };
  const PublicPageComponent = publicPages[location];
  if (PublicPageComponent) {
    return <PublicPageComponent />;
  }
  
  // Public pages render without sidebar/header
  if (location.startsWith("/track/")) {
    return <PublicTrack />;
  }
  
  // Repair link bridge page (handles auth redirect)
  if (location.startsWith("/repair-link/")) {
    return <RepairLink />;
  }
  
  // Shop/marketplace pages render without sidebar (public storefront)
  // Exclude /shop/admin/* which requires authenticated layout
  if (location === "/marketplace" || location.startsWith("/marketplace/") || (location.startsWith("/shop/") && !location.startsWith("/shop/admin"))) {
    return <ShopRouter />;
  }
  
  // All other pages use the main layout with sidebar
  return <AppLayout />;
}
