import {
  LayoutDashboard,
  Users,
  UsersRound,
  Wrench,
  Package,
  FileText,
  MessageSquare,
  Settings,
  Ticket,
  Building,
  Building2,
  ShoppingCart,
  LogOut,
  Shield,
  BarChart3,
  Store,
  Receipt,
  Truck,
  Undo2,
  RotateCcw,
  ClipboardList,
  Zap,
  Phone,
  FileCheck,
  Coins,
  PieChart,
  CalendarCheck,
  Smartphone,
  Plug,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Network,
  Warehouse,
  TrendingUp,
  FolderOpen,
  Inbox,
  Send,
  ArrowRightLeft,
  UserCircle,
  Tag,
  Briefcase,
  Clock,
  Calendar,
  Stethoscope,
  ReceiptText,
  AlertTriangle,
  Link2,
  Bell,
  ListOrdered,
  Calculator,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, Fragment, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useStaffPermissions, getRequiredModuleForUrl } from "@/hooks/use-staff-permissions";
import { useLicenseStatus } from "@/hooks/use-license-status";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { Badge } from "@/components/ui/badge";

interface ActingAs {
  type: 'reseller' | 'repair_center';
  id: string;
  name: string;
}

interface ContextResponse {
  actingAs: ActingAs | null;
}

const menuItems = {
  admin: [
    { title: "sidebar.items.dashboard", url: "/admin", icon: LayoutDashboard, group: "Dashboard" },
    { title: "sidebar.items.posOverview", url: "/admin/pos", icon: Receipt, group: "POS" },
    { title: "sidebar.items.customers", url: "/admin/customers", icon: Users, group: "Clienti & Rivenditori" },
    { title: "sidebar.items.resellers", url: "/admin/resellers", icon: Store, group: "Clienti & Rivenditori" },
    { title: "sidebar.items.resellerTeams", url: "/admin/reseller-teams", icon: UsersRound, group: "Clienti & Rivenditori" },
    { title: "sidebar.items.repairCenters", url: "/admin/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "sidebar.items.jobs", url: "/admin/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "sidebar.items.utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "sidebar.items.utilitySuppliers", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "sidebar.items.serviceList", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "sidebar.items.practices", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "sidebar.items.commissions", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "sidebar.items.utilityReport", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "sidebar.items.myWarehouse", url: "/admin/warehouses", icon: Warehouse, group: t("common.warehouse") },
    { title: "sidebar.items.allWarehouses", url: "/admin/all-warehouses", icon: Building2, group: t("common.warehouse") },
    { title: "sidebar.items.spareParts", url: "/admin/products", icon: Package, group: t("common.warehouse") },
    { title: "sidebar.items.devices", url: "/admin/dispositivi", icon: Smartphone, group: t("common.warehouse") },
    { title: "sidebar.items.accessories", url: "/admin/accessory-catalog", icon: ShoppingCart, group: t("common.warehouse") },
    { title: "sidebar.items.overview", url: "/admin/transfer-requests/overview", icon: ArrowRightLeft, group: "Interscambio" },
    { title: "sidebar.items.allTransferRequests", url: "/admin/transfer-requests", icon: Inbox, group: "Interscambio" },
    { title: "sidebar.items.utilitySuppliers", url: "/admin/suppliers", icon: Truck, group: "Fornitori" },
    { title: "sidebar.items.supplierOrders", url: "/admin/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    { title: "sidebar.items.supplierReturns", url: "/admin/supplier-returns", icon: Undo2, group: "Fornitori" },
    { title: "sidebar.items.invoices", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    { title: "sidebar.items.productAssignment", url: "/admin/product-assignments", icon: Store, group: "E-commerce" },
    { title: "sidebar.items.orders", url: "/admin/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    { title: "sidebar.items.resellerOrders", url: "/admin/b2b-orders", icon: Network, group: "E-commerce" },
    { title: "sidebar.items.rcB2BOrders", url: "/admin/rc-b2b-orders", icon: Building, group: "E-commerce" },
    { title: "sidebar.items.customerReturns", url: "/admin/sales-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "sidebar.items.b2bReturns", url: "/admin/b2b-returns", icon: Undo2, group: "E-commerce" },
    { title: "sidebar.items.shipments", url: "/admin/shipments", icon: Truck, group: "E-commerce" },
    { title: "sidebar.items.payments", url: "/admin/payments", icon: CreditCard, group: "E-commerce" },
    { title: "sidebar.items.leaveRequestsAlt", url: "/admin/hr/leave-requests", icon: Calendar, group: "Risorse Umane" },
    { title: "sidebar.items.sickLeave", url: "/admin/hr/sick-leave", icon: Stethoscope, group: "Risorse Umane" },
    { title: "sidebar.items.expenses", url: "/admin/hr/expenses", icon: Receipt, group: "Risorse Umane" },
    { title: "sidebar.items.attendance", url: "/admin/hr/attendance", icon: Clock, group: "Risorse Umane" },
    { title: "sidebar.items.hrCalendar", url: "/admin/hr/calendar", icon: Calendar, group: "Risorse Umane" },
    { title: "sidebar.items.deviceCatalog", url: "/admin/device-catalog", icon: Package, group: "Cataloghi" },
    { title: "sidebar.items.deviceCompatibilities", url: "/admin/device-compatibilities", icon: Link2, group: "Cataloghi" },
    { title: "sidebar.items.priceList", url: "/admin/service-catalog", icon: Receipt, group: "Cataloghi" },
    { title: "sidebar.items.interventionOrders", url: "/admin/service-orders", icon: FileText, group: "Cataloghi" },
    { title: "sidebar.items.utilityCategories", url: "/admin/utility-categories", icon: FolderOpen, group: "Cataloghi" },
    { title: "sidebar.items.licensePlans", url: "/admin/license-plans", icon: CreditCard, group: "Licenze" },
    { title: "sidebar.items.activeLicenses", url: "/admin/licenses", icon: Shield, group: "Licenze" },
    { title: "sidebar.items.networkPriceLists", url: "/admin/price-lists", icon: ListOrdered, group: "Configurazione" },
    { title: "sidebar.items.customerWarranties", url: "/admin/warranties", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.warrantyProducts", url: "/admin/warranty-products", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.warrantyAnalytics", url: "/admin/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    { title: "sidebar.items.externalIntegrations", url: "/admin/external-integrations", icon: Plug, group: "Configurazione" },
    { title: "sidebar.items.activityLogs", url: "/admin/activity-logs", icon: FileText, group: "Configurazione" },
    { title: "sidebar.items.unreparableReasons", url: "/admin/unrepairable-reasons", icon: AlertTriangle, group: "Configurazione" },
    { title: "sidebar.items.diagnosisSettings", url: "/admin/diagnosis-settings", icon: Settings, group: "Configurazione" },
    { title: "sidebar.items.settings", url: "/admin/settings", icon: Settings, group: "Configurazione" },
    { title: "sidebar.items.teamAdmin", url: "/admin/team", icon: UsersRound, group: "Team" },
    { title: "sidebar.items.tickets", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "sidebar.items.liveChat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
    { title: "sidebar.items.remoteRequests", url: "/admin/remote-requests", icon: Send, group: "Centri & Riparazioni" },
  ],
  admin_staff: [
    { title: "sidebar.items.dashboard", url: "/admin", icon: LayoutDashboard, group: "Dashboard" },
    { title: "sidebar.items.customers", url: "/admin/customers", icon: Users, group: "Clienti & Rivenditori" },
    { title: "sidebar.items.resellers", url: "/admin/resellers", icon: Store, group: "Clienti & Rivenditori" },
    { title: "sidebar.items.resellerTeams", url: "/admin/reseller-teams", icon: UsersRound, group: "Clienti & Rivenditori" },
    { title: "sidebar.items.repairCenters", url: "/admin/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "sidebar.items.jobs", url: "/admin/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "sidebar.items.utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "sidebar.items.utilitySuppliers", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "sidebar.items.serviceList", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "sidebar.items.practices", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "sidebar.items.commissions", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "sidebar.items.utilityReport", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "sidebar.items.myWarehouse", url: "/admin/warehouses", icon: Warehouse, group: t("common.warehouse") },
    { title: "sidebar.items.allWarehouses", url: "/admin/all-warehouses", icon: Building2, group: t("common.warehouse") },
    { title: "sidebar.items.spareParts", url: "/admin/products", icon: Package, group: t("common.warehouse") },
    { title: "sidebar.items.devices", url: "/admin/dispositivi", icon: Smartphone, group: t("common.warehouse") },
    { title: "sidebar.items.accessories", url: "/admin/accessory-catalog", icon: ShoppingCart, group: t("common.warehouse") },
    { title: "sidebar.items.overview", url: "/admin/transfer-requests/overview", icon: ArrowRightLeft, group: "Interscambio" },
    { title: "sidebar.items.allTransferRequests", url: "/admin/transfer-requests", icon: Inbox, group: "Interscambio" },
    { title: "sidebar.items.utilitySuppliers", url: "/admin/suppliers", icon: Truck, group: "Fornitori" },
    { title: "sidebar.items.supplierOrders", url: "/admin/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    { title: "sidebar.items.supplierReturns", url: "/admin/supplier-returns", icon: Undo2, group: "Fornitori" },
    { title: "sidebar.items.invoices", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    { title: "sidebar.items.productAssignment", url: "/admin/product-assignments", icon: Store, group: "E-commerce" },
    { title: "sidebar.items.orders", url: "/admin/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    { title: "sidebar.items.customerReturns", url: "/admin/sales-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "sidebar.items.shipments", url: "/admin/shipments", icon: Truck, group: "E-commerce" },
    { title: "sidebar.items.payments", url: "/admin/payments", icon: CreditCard, group: "E-commerce" },
    { title: "sidebar.items.deviceCatalog", url: "/admin/device-catalog", icon: Package, group: "Sistema" },
    { title: "sidebar.items.deviceCompatibilities", url: "/admin/device-compatibilities", icon: Link2, group: "Sistema" },
    { title: "sidebar.items.priceList", url: "/admin/service-catalog", icon: Receipt, group: "Sistema" },
    { title: "sidebar.items.networkPriceLists", url: "/admin/price-lists", icon: ListOrdered, group: "Sistema" },
    { title: "sidebar.items.licensePlans", url: "/admin/license-plans", icon: CreditCard, group: "Licenze" },
    { title: "sidebar.items.activeLicenses", url: "/admin/licenses", icon: Shield, group: "Licenze" },
    { title: "sidebar.items.tickets", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "sidebar.items.liveChat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
  ],
  reseller: [
    { title: "sidebar.items.dashboard", url: "/reseller", icon: LayoutDashboard, group: "Dashboard" },
    { title: "sidebar.items.customers", url: "/reseller/customers", icon: Users, group: "Clienti" },
    { title: "sidebar.items.repairCentersShort", url: "/reseller/repair-centers", icon: Building, group: "Riparazioni" },
    { title: "sidebar.items.jobs", url: "/reseller/repairs", icon: Wrench, group: "Riparazioni" },
    { title: "sidebar.items.appointments", url: "/reseller/appointments", icon: CalendarCheck, group: "Riparazioni" },
    { title: "sidebar.items.remoteRequests", url: "/reseller/remote-requests", icon: Send, group: "Riparazioni" },
    { title: "sidebar.items.myServices", url: "/reseller/service-catalog", icon: Receipt, group: "Riparazioni" },
    { title: "sidebar.items.deviceCatalog", url: "/reseller/device-catalog", icon: Smartphone, group: "Riparazioni" },
    { title: "sidebar.items.interventionOrders", url: "/reseller/service-orders", icon: ClipboardList, group: "Riparazioni" },
    { title: "sidebar.items.quotes", url: "/reseller/standalone-quotes", icon: FileText, group: "Riparazioni" },
    { title: "sidebar.items.posOverview", url: "/reseller/pos", icon: Receipt, group: "Cassa e Vendite" },
    { title: "sidebar.items.salesHistory", url: "/reseller/pos/sales-history", icon: ShoppingCart, group: "Cassa e Vendite" },
    { title: "sidebar.items.historySessions", url: "/reseller/pos/sessions", icon: Clock, group: "Cassa e Vendite" },
    { title: "sidebar.items.posRegisters", url: "/reseller/pos/registers", icon: Store, group: "Cassa e Vendite" },
    { title: "sidebar.items.salesOverview", url: "/reseller/sales", icon: TrendingUp, group: "Cassa e Vendite" },
    { title: "sidebar.items.invoices", url: "/reseller/invoices", icon: FileText, group: "Cassa e Vendite" },
    { title: "sidebar.items.reports", url: "/reseller/reports", icon: BarChart3, group: "Cassa e Vendite" },
    { title: "sidebar.items.warehouse", url: "/reseller/warehouses", icon: Warehouse, group: "Magazzino e Fornitori", section: "sidebar.sections.warehouse" },
    { title: "sidebar.items.networkWarehouses", url: "/reseller/network-warehouses", icon: Building2, group: "Magazzino e Fornitori", section: "sidebar.sections.warehouse" },
    { title: "sidebar.items.spareParts", url: "/reseller/products", icon: Package, group: "Magazzino e Fornitori", section: "sidebar.sections.warehouse" },
    { title: "sidebar.items.devices", url: "/reseller/dispositivi", icon: Smartphone, group: "Magazzino e Fornitori", section: "sidebar.sections.warehouse" },
    { title: "sidebar.items.accessories", url: "/reseller/accessory-catalog", icon: ShoppingCart, group: "Magazzino e Fornitori", section: "sidebar.sections.warehouse" },
    { title: "sidebar.items.priceLists", url: "/reseller/price-lists", icon: ListOrdered, group: "Magazzino e Fornitori", section: "sidebar.sections.warehouse" },
    { title: "sidebar.items.transferOverview", url: "/reseller/transfer-requests", icon: ArrowRightLeft, group: "Magazzino e Fornitori", section: "sidebar.sections.transfersSection" },
    { title: "sidebar.items.transferRequestsReceived", url: "/reseller/incoming-transfer-requests", icon: Inbox, group: "Magazzino e Fornitori", section: "sidebar.sections.transfersSection" },
    { title: "sidebar.items.transferRequests", url: "/reseller/sub-transfer-requests", icon: Send, group: "Magazzino e Fornitori", section: "sidebar.sections.transfersSection" },
    { title: "sidebar.items.utilitySuppliers", url: "/reseller/suppliers", icon: Truck, group: "Magazzino e Fornitori", section: "sidebar.sections.supply" },
    { title: "sidebar.items.supplierOrders", url: "/reseller/supplier-orders", icon: ShoppingCart, group: "Magazzino e Fornitori", section: "sidebar.sections.supply" },
    { title: "sidebar.items.supplierReturns", url: "/reseller/supplier-returns", icon: RotateCcw, group: "Magazzino e Fornitori", section: "sidebar.sections.supply" },
    { title: "sidebar.items.shopCatalog", url: "/reseller/shop-catalog", icon: Store, group: "Vendite Online", section: "sidebar.sections.ecommerce" },
    { title: "sidebar.items.orders", url: "/reseller/sales-orders", icon: ShoppingCart, group: "Vendite Online", section: "sidebar.sections.ecommerce" },
    { title: "sidebar.items.customerReturns", url: "/reseller/sales-returns", icon: RotateCcw, group: "Vendite Online", section: "sidebar.sections.ecommerce" },
    { title: "sidebar.items.shipments", url: "/reseller/shipments", icon: Truck, group: "Vendite Online", section: "sidebar.sections.ecommerce" },
    { title: "sidebar.items.payments", url: "/reseller/payments", icon: CreditCard, group: "Vendite Online", section: "sidebar.sections.ecommerce" },
    { title: "sidebar.items.b2bCatalog", url: "/reseller/b2b-catalog", icon: Package, group: "Vendite Online", section: "sidebar.sections.purchasesB2B" },
    { title: "sidebar.items.myB2BOrders", url: "/reseller/b2b-orders", icon: ShoppingCart, group: "Vendite Online", section: "sidebar.sections.purchasesB2B" },
    { title: "sidebar.items.myB2BReturns", url: "/reseller/b2b-returns", icon: RotateCcw, group: "Vendite Online", section: "sidebar.sections.purchasesB2B" },
    { title: "sidebar.items.marketplaceCatalog", url: "/reseller/marketplace", icon: Store, group: "Vendite Online", section: "sidebar.sections.marketplace" },
    { title: "sidebar.items.myPurchases", url: "/reseller/marketplace-orders", icon: ShoppingCart, group: "Vendite Online", section: "sidebar.sections.marketplace" },
    { title: "sidebar.items.resellerSales", url: "/reseller/marketplace-sales", icon: TrendingUp, group: "Vendite Online", section: "sidebar.sections.sales" },
    { title: "sidebar.items.rcSales", url: "/reseller/rc-b2b-orders", icon: Building2, group: "Vendite Online", section: "sidebar.sections.sales" },
    { title: "sidebar.items.utility", url: "/reseller/utility", icon: Zap, group: "Utility" },
    { title: "sidebar.items.utilitySuppliers", url: "/reseller/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "sidebar.items.utilityServices", url: "/reseller/utility/services", icon: Package, group: "Utility" },
    { title: "sidebar.items.practices", url: "/reseller/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "sidebar.items.commissions", url: "/reseller/utility/commissions", icon: Coins, group: "Utility" },
    { title: "sidebar.items.utilityReport", url: "/reseller/utility/reports", icon: PieChart, group: "Utility" },
    { title: "sidebar.items.customerWarranties", url: "/reseller/warranties", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.warrantyProducts", url: "/reseller/warranty-products", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.warrantyAnalytics", url: "/reseller/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    { title: "sidebar.items.dashboardHR", url: "/reseller/hr", icon: Briefcase, group: "Gestione HR" },
    { title: "sidebar.items.team", url: "/reseller/team", icon: UsersRound, group: "Gestione HR" },
    { title: "sidebar.items.attendance", url: "/reseller/hr/attendance", icon: Clock, group: "Gestione HR" },
    { title: "sidebar.items.leaveRequests", url: "/reseller/hr/leave-requests", icon: Calendar, group: "Gestione HR" },
    { title: "sidebar.items.workProfiles", url: "/reseller/hr/work-profiles", icon: Settings, group: "Gestione HR" },
    { title: "sidebar.items.expenseReimbursement", url: "/reseller/hr/expenses", icon: ReceiptText, group: "Gestione HR" },
    { title: "sidebar.items.sickLeave", url: "/reseller/hr/sick-leave", icon: Stethoscope, group: "Gestione HR" },
    { title: "sidebar.items.teamCalendar", url: "/reseller/hr/calendar", icon: CalendarCheck, group: "Gestione HR" },
    { title: "sidebar.items.tickets", url: "/reseller/tickets", icon: Ticket, group: "Assistenza" },
    { title: "sidebar.items.guide", url: "/reseller/guide", icon: FileText, group: "Assistenza" },
    { title: "sidebar.items.notifications", url: "/reseller/notifications", icon: Bell, group: "Account" },
    { title: "sidebar.items.myLicense", url: "/reseller/my-license", icon: Shield, group: "Account" },
    { title: "sidebar.items.integrations", url: "/reseller/integrations", icon: Plug, group: "Account" },
    { title: "sidebar.items.settings", url: "/reseller/settings", icon: Settings, group: "Account" },
    { title: "sidebar.items.profile", url: "/profile", icon: UserCircle, group: "Account" },
  ],
  sub_reseller: [
    { title: "sidebar.items.dashboard", url: "/reseller", icon: LayoutDashboard, group: "Dashboard" },
    { title: "sidebar.items.serviceCatalog", url: "/sub-reseller/service-catalog", icon: Wrench, group: "Servizi" },
    { title: "sidebar.items.posOverview", url: "/reseller/pos", icon: Receipt, group: "POS" },
    { title: "sidebar.items.posSalesHistory", url: "/reseller/pos/sales-history", icon: Clock, group: "POS" },
    { title: "sidebar.items.posSessions", url: "/reseller/pos/sessions", icon: FileText, group: "POS" },
    { title: "sidebar.items.registers", url: "/reseller/pos/registers", icon: Calculator, group: "POS" },
    { title: "sidebar.items.jobs", url: "/reseller/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "sidebar.items.repairCentersShort", url: "/reseller/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "sidebar.items.remoteRequests", url: "/reseller/remote-requests", icon: Send, group: "Centri & Riparazioni" },
    { title: "sidebar.items.quotes", url: "/reseller/standalone-quotes", icon: FileText, group: "Centri & Riparazioni" },
    { title: "sidebar.items.myWarehouse", url: "/reseller/warehouses", icon: Warehouse, group: t("common.warehouse") },
    { title: "sidebar.items.customerWarranties", url: "/reseller/warranties", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.warrantyAnalytics", url: "/reseller/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    { title: "sidebar.items.invoices", url: "/reseller/invoices", icon: FileText, group: "Fatturazione" },
    { title: "sidebar.items.profile", url: "/profile", icon: UserCircle, group: "Account" },
  ],
  repair_center: [
    { title: "sidebar.items.dashboard", url: "/repair-center", icon: LayoutDashboard, group: "Dashboard" },
    { title: "sidebar.items.pos", url: "/repair-center/pos", icon: Receipt, group: "Cassa e Vendite" },
    { title: "sidebar.items.salesHistory", url: "/repair-center/pos/sales-history", icon: ShoppingCart, group: "Cassa e Vendite" },
    { title: "sidebar.items.historySessions", url: "/repair-center/pos/sessions", icon: Clock, group: "Cassa e Vendite" },
    { title: "sidebar.items.posRegisters", url: "/repair-center/pos/registers", icon: Store, group: "Cassa e Vendite" },
    { title: "sidebar.items.jobs", url: "/repair-center/repairs", icon: Wrench, group: "Lavorazioni" },
    { title: "sidebar.items.appointments", url: "/repair-center/appointments", icon: CalendarCheck, group: "Lavorazioni" },
    { title: "sidebar.items.serviceListAlt", url: "/repair-center/service-catalog", icon: Receipt, group: "Lavorazioni" },
    { title: "sidebar.items.interventionOrders", url: "/repair-center/service-orders", icon: FileText, group: "Lavorazioni" },
    { title: "sidebar.items.remoteRequests", url: "/repair-center/remote-requests", icon: Send, group: "Lavorazioni" },
    { title: "sidebar.items.quotes", url: "/repair-center/standalone-quotes", icon: FileText, group: "Lavorazioni" },
    { title: "sidebar.items.warehouse", url: "/repair-center/warehouses", icon: Warehouse, group: "Magazzino e Fornitori" },
    { title: "sidebar.items.products", url: "/repair-center/products", icon: Package, group: "Magazzino e Fornitori" },
    { title: "sidebar.items.priceLists", url: "/repair-center/price-lists", icon: ListOrdered, group: "Magazzino e Fornitori" },
    { title: "sidebar.items.utilitySuppliers", url: "/repair-center/suppliers", icon: Truck, group: "Magazzino e Fornitori" },
    { title: "sidebar.items.supplierOrders", url: "/repair-center/supplier-orders", icon: ShoppingCart, group: "Magazzino e Fornitori" },
    { title: "sidebar.sections.transfers", url: "/repair-center/transfer-requests/overview", icon: ArrowRightLeft, group: "Magazzino e Fornitori" },
    { title: "sidebar.items.newRequest", url: "/repair-center/transfer-requests", icon: Send, group: "Magazzino e Fornitori" },
    { title: "sidebar.items.devices", url: "/repair-center/dispositivi", icon: Smartphone, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.accessories", url: "/repair-center/accessory-catalog", icon: ShoppingCart, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.spareParts", url: "/repair-center/spare-parts-catalog", icon: Wrench, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.cart", url: "/repair-center/cart", icon: ShoppingCart, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.catalogResellerAlt", url: "/repair-center/b2b-catalog", icon: Store, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.resellerMarketplace", url: "/repair-center/marketplace", icon: Store, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.b2bOrders", url: "/repair-center/b2b-orders", icon: FileText, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.b2bReturns", url: "/repair-center/b2b-returns", icon: RotateCcw, group: "Cataloghi e Acquisti" },
    { title: "sidebar.items.utility", url: "/repair-center/utility", icon: Zap, group: "Utility" },
    { title: "sidebar.items.utilitySuppliers", url: "/repair-center/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "sidebar.items.serviceList", url: "/repair-center/utility/services", icon: Package, group: "Utility" },
    { title: "sidebar.items.practices", url: "/repair-center/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "sidebar.items.commissions", url: "/repair-center/utility/commissions", icon: Coins, group: "Utility" },
    { title: "sidebar.items.utilityReport", url: "/repair-center/utility/reports", icon: PieChart, group: "Utility" },
    { title: "sidebar.items.dashboardHR", url: "/repair-center/hr", icon: Briefcase, group: "Gestione HR" },
    { title: "sidebar.items.team", url: "/repair-center/team", icon: UsersRound, group: "Gestione HR" },
    { title: "sidebar.items.attendance", url: "/repair-center/hr/attendance", icon: Clock, group: "Gestione HR" },
    { title: "sidebar.items.leaveRequests", url: "/repair-center/hr/leave-requests", icon: Calendar, group: "Gestione HR" },
    { title: "sidebar.items.workProfiles", url: "/repair-center/hr/work-profiles", icon: Settings, group: "Gestione HR" },
    { title: "sidebar.items.expenseReimbursement", url: "/repair-center/hr/expenses", icon: ReceiptText, group: "Gestione HR" },
    { title: "sidebar.items.sickLeave", url: "/repair-center/hr/sick-leave", icon: Stethoscope, group: "Gestione HR" },
    { title: "sidebar.items.teamCalendar", url: "/repair-center/hr/calendar", icon: CalendarCheck, group: "Gestione HR" },
    { title: "sidebar.items.customers", url: "/repair-center/customers", icon: Users, group: "Gestione" },
    { title: "sidebar.items.invoices", url: "/repair-center/invoices", icon: FileText, group: "Gestione" },
    { title: "sidebar.items.settings", url: "/repair-center/settings", icon: Settings, group: "Gestione" },
    { title: "sidebar.items.warrantyCatalog", url: "/repair-center/warranty-products", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.customerWarranties", url: "/repair-center/warranties", icon: Shield, group: "Garanzie" },
    { title: "sidebar.items.warrantyAnalytics", url: "/repair-center/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    { title: "sidebar.items.tickets", url: "/repair-center/tickets", icon: Ticket, group: "Assistenza" },
  ],
  customer: [
    { title: "sidebar.items.dashboard", url: "/customer", icon: LayoutDashboard, group: "Dashboard" },
    { title: "sidebar.items.repairs", url: "/customer/repairs", icon: Wrench, group: "Riparazioni" },
    { title: "sidebar.items.remoteRequests", url: "/customer/remote-requests", icon: Send, group: "Riparazioni" },
    { title: "sidebar.items.myWarranties", url: "/customer/warranties", icon: Shield, group: "Servizi" },
    { title: "sidebar.items.serviceCatalog", url: "/customer/service-catalog", icon: Package, group: "Servizi" },
    { title: "sidebar.items.serviceOrders", url: "/customer/service-orders", icon: ClipboardList, group: "Servizi" },
    { title: "sidebar.items.salesOrders", url: "/customer/orders", icon: ShoppingCart, group: "Acquisti" },
    { title: "sidebar.items.returns", url: "/customer/sales-returns", icon: RotateCcw, group: "Acquisti" },
    { title: "sidebar.items.tickets", url: "/customer/tickets", icon: Ticket, group: "Assistenza" },
    { title: "sidebar.items.profile", url: "/customer/profile", icon: UserCircle, group: "Account" },
  ],
};

const integratedSuppliersConfig = [
  {
    key: "sifar",
    label: "sidebar.items.sifar",
    routes: [
      { title: "sidebar.items.catalog", path: "/catalog", icon: Package },
      { title: "sidebar.items.cart", path: "/cart", icon: ShoppingCart },
      { title: "sidebar.items.configuration", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "foneday",
    label: "sidebar.items.foneday",
    routes: [
      { title: "sidebar.items.catalog", path: "/catalog", icon: Package },
      { title: "sidebar.items.cart", path: "/cart", icon: ShoppingCart },
      { title: "sidebar.items.configuration", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "mobilesentrix",
    label: "sidebar.items.mobileSentrix",
    routes: [
      { title: "sidebar.items.catalog", path: "/catalog", icon: Package },
      { title: "sidebar.items.cart", path: "/cart", icon: ShoppingCart },
      { title: "sidebar.items.myOrders", path: "/orders", icon: ClipboardList },
      { title: "sidebar.items.configuration", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "trovausati",
    label: "sidebar.items.trovaUsati",
    routes: [
      { title: "sidebar.items.b2bMarketplace", path: "/marketplace", icon: ShoppingCart },
      { title: "sidebar.items.evaluator", path: "/valutatore", icon: Tag },
      { title: "sidebar.items.configuration", path: "/settings", icon: Settings },
    ],
  },
];

const getIntegratedSuppliers = (rolePrefix: string) => 
  integratedSuppliersConfig.map(s => ({ ...s, basePath: `/${rolePrefix}/${s.key}` }));

const groupIcons: Record<string, typeof LayoutDashboard> = {
  "Dashboard": LayoutDashboard,
  "Clienti": Users,
  "Clienti & Rivenditori": Users,
  "Clienti & Team": Users,
  "Riparazioni": Wrench,
  "Centri & Riparazioni": Wrench,
  "Cassa e Vendite": Receipt,
  "Magazzino e Fornitori": Warehouse,
  "Magazzino & Fornitori": Package,
  "Magazzino": Package,
  "Fornitori": Truck,
  "Vendite Online": ShoppingCart,
  "Sistema": Settings,
  "Utility": Zap,
  "Fatturazione": FileText,
  "Garanzie": Shield,
  "E-commerce": ShoppingCart,
  "Acquisti B2B": Network,
  "Marketplace P2P": Store,
  "Assistenza": Ticket,
  "Principale": LayoutDashboard,
  "Sub-Reseller": Network,
  "Le mie riparazioni": Wrench,
  "Lavorazioni": Wrench,
  "Cataloghi": Package,
  "Cataloghi e Acquisti": ShoppingCart,
  "Gestione": Settings,
  "Gestione HR": Briefcase,
  "Acquisti": ShoppingCart,
  "Marketplace": Store,
  "Interscambio": ArrowRightLeft,
  "Configurazione": Settings,
  "Network B2B": Network,
  "Monitoraggio": Shield,
  "Integrazioni": Plug,
  "Team": UsersRound,
  "POS": Receipt,
  "Risorse Umane": Briefcase,
  "Licenze": Shield,
  "Servizi": Wrench,
};

const SIDEBAR_GROUP_TO_FEATURES: Record<string, string[]> = {
  "Riparazioni": ["repairs"],
  "Centri & Riparazioni": ["repairs"],
  "Clienti": ["crm"],
  "Cassa e Vendite": ["pos", "invoicing"],
  "Magazzino e Fornitori": ["warehouse"],
  "Magazzino": ["warehouse"],
  "Interscambio": ["warehouse"],
  "Fornitori": ["warehouse"],
  "Vendite Online": ["b2b_orders", "marketplace", "payments"],
  "Fatturazione": ["invoicing"],
  "POS": ["pos"],
  "E-commerce": ["b2b_orders", "marketplace"],
  "Acquisti B2B": ["b2b_orders"],
  "Marketplace P2P": ["marketplace"],
  "Assistenza": ["ticketing"],
  "Garanzie": ["warranty"],
  "Sub-Reseller": ["push_notifications"],
};

const SIDEBAR_URL_TO_FEATURES: Record<string, string[]> = {
  "/reseller/customers": ["crm"],
  "/reseller/payments": ["payments"],
  "/reseller/reports": ["analytics"],
  "/reseller/warranty-analytics": ["analytics", "warranty"],
  "/reseller/notifications": ["push_notifications"],
  "/reseller/pos": ["pos"],
  "/reseller/pos/sales-history": ["pos"],
  "/reseller/pos/sessions": ["pos"],
  "/reseller/pos/registers": ["pos"],
};

const groupTranslationKeys: Record<string, string> = {
  "Dashboard": "sidebar.sections.dashboard",
  "POS": "sidebar.sections.posSection",
  "Clienti & Rivenditori": "sidebar.sections.customersAndResellers",
  "Clienti & Team": "sidebar.sections.customersAndResellers",
  "Centri & Riparazioni": "sidebar.sections.centersAndRepairs",
  "Utility": "sidebar.sections.utility",
  "Magazzino": "sidebar.sections.warehouse",
  "Interscambio": "sidebar.sections.transfers",
  "Fornitori": "sidebar.sections.supply",
  "Fatturazione": "sidebar.sections.billing",
  "E-commerce": "sidebar.sections.ecommerce",
  "Risorse Umane": "sidebar.sections.humanResources",
  "Cataloghi": "sidebar.sections.catalog",
  "Cataloghi e Acquisti": "sidebar.sections.catalogAndPurchases",
  "Licenze": "sidebar.sections.licenses",
  "Configurazione": "sidebar.sections.configuration",
  "Garanzie": "sidebar.sections.warranties",
  "Team": "sidebar.sections.team",
  "Assistenza": "sidebar.sections.support",
  "Riparazioni": "sidebar.sections.repairs",
  "Cassa e Vendite": "sidebar.sections.pos",
  "Magazzino e Fornitori": "sidebar.sections.warehouseAndSuppliers",
  "Vendite Online": "sidebar.sections.onlineSales",
  "Gestione HR": "sidebar.sections.hrManagement",
  "Account": "sidebar.sections.account",
  "Lavorazioni": "sidebar.sections.jobs",
  "Gestione": "sidebar.sections.management",
  "Sub-Reseller": "sidebar.sections.subReseller",
  "Servizi": "sidebar.sections.services",
  "Acquisti": "sidebar.sections.purchases",
  "Sistema": "sidebar.sections.system",
  "Principale": "sidebar.sections.main",
  "Clienti": "sidebar.sections.customers",
};

export function AppSidebar() {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});
  const { canAccessModule, hasFullAccess } = useStaffPermissions();
  const { hasFeature, hasAllFeatures, isReseller: isLicenseReseller } = useLicenseStatus();

  const isReseller = user?.role === "reseller";
  const isResellerStaff = user?.role === "reseller_staff";
  const isRepairCenter = user?.role === "repair_center";
  const isFranchisingOrGdo = user?.resellerCategory === "franchising" || user?.resellerCategory === "gdo";
  const hasParentReseller = !!(user as any)?.parentResellerId;
  const shouldShowResellerLogo = hasParentReseller || isResellerStaff || isRepairCenter;

  const { data: parentReseller } = useQuery<{ id: string; fullName: string; logoUrl: string | null; ragioneSociale: string | null }>({
    queryKey: ["/api/my-parent-reseller"],
    enabled: shouldShowResellerLogo,
  });

  const { data: repairCenterData } = useQuery<{ id: number; name: string; logoUrl: string | null }>({
    queryKey: ["/api/repair-center/settings"],
    enabled: isRepairCenter,
    select: (data: any) => ({ id: data.id, name: data.name, logoUrl: data.logoUrl }),
  });

  const isSubReseller = isReseller && hasParentReseller;

  const sidebarLogoUrl = isRepairCenter && repairCenterData?.logoUrl 
    ? repairCenterData.logoUrl 
    : isSubReseller && user?.logoUrl
      ? user.logoUrl
      : parentReseller?.logoUrl;
  const sidebarLogoName = isRepairCenter && repairCenterData?.logoUrl
    ? repairCenterData.name
    : isSubReseller && user?.logoUrl
      ? ((user as any).ragioneSociale || user?.fullName)
      : (parentReseller?.ragioneSociale || parentReseller?.fullName);

  const { data: subResellers = [] } = useQuery<any[]>({
    queryKey: ["/api/reseller/sub-resellers"],
    enabled: isReseller && isFranchisingOrGdo,
  });

  const hasSubResellers = subResellers.length > 0;

  const { data: contextData } = useQuery<ContextResponse>({
    queryKey: ['/api/reseller/context'],
    enabled: isReseller || isResellerStaff,
  });
  const actingAs = contextData?.actingAs;

  const { data: configuredIntegrationCodes = [] } = useQuery<string[]>({
    queryKey: ["/api/reseller/configured-integrations"],
    enabled: isReseller || isResellerStaff,
  });
  
  const { data: rcConfiguredIntegrationCodes = [] } = useQuery<string[]>({
    queryKey: ["/api/repair-center/configured-integrations"],
    enabled: isRepairCenter,
  });
  
  const rolePrefix = isRepairCenter ? "repair-center" : "reseller";
  const activeIntegrationCodes = isRepairCenter ? rcConfiguredIntegrationCodes : configuredIntegrationCodes;
  const integratedSuppliers = getIntegratedSuppliers(rolePrefix);
  
  const filteredIntegratedSuppliers = integratedSuppliers.filter(
    supplier => activeIntegrationCodes.includes(supplier.key)
  );

  const items = useMemo(() => {
    let baseItems: typeof menuItems.admin = [];
    
    if ((isReseller || isResellerStaff) && actingAs) {
      if (actingAs.type === 'repair_center') {
        baseItems = [...menuItems.repair_center];
      } else if (actingAs.type === 'reseller') {
        baseItems = [...menuItems.reseller];
        baseItems = baseItems.filter(item => item.url !== "/reseller/sub-resellers");
      }
    } else {
      if (user?.role === "reseller_staff") {
        baseItems = [...menuItems.reseller];
      } else if (user) {
        baseItems = menuItems[user.role as keyof typeof menuItems] || [];
      }
    }
    
    if (isResellerStaff && !hasFullAccess && !actingAs) {
      baseItems = baseItems.filter(item => {
        if (item.url === "/reseller") return true;
        if (item.url === "/reseller/guide") return true;
        
        const requiredModule = getRequiredModuleForUrl(item.url);
        if (requiredModule) {
          return canAccessModule(requiredModule);
        }
        
        return true;
      });
      
      baseItems = baseItems.filter(item => 
        item.url !== "/reseller/team" && 
        item.url !== "/reseller/sub-resellers"
      );
    }
    
    if ((isReseller || isResellerStaff) && isLicenseReseller && !hasAllFeatures && !actingAs) {
      baseItems = baseItems.filter(item => {
        if (item.group === "Dashboard" || item.group === "Account") return true;
        if (item.url === "/reseller/guide") return true;
        const urlFeatures = SIDEBAR_URL_TO_FEATURES[item.url];
        if (urlFeatures) {
          return urlFeatures.some(f => hasFeature(f));
        }
        const groupFeatures = SIDEBAR_GROUP_TO_FEATURES[item.group];
        if (groupFeatures) {
          return groupFeatures.some(f => hasFeature(f));
        }
        return true;
      });
    }

    if (isReseller && isFranchisingOrGdo && !actingAs) {
      const dashboardIndex = baseItems.findIndex(item => item.url === "/reseller");
      if (dashboardIndex !== -1) {
        const subResellerItem = { 
          title: "sidebar.items.subResellers", 
          url: "/reseller/sub-resellers", 
          icon: Network, 
          group: "Sub-Reseller" 
        };
        return [
          ...baseItems.slice(0, dashboardIndex + 1),
          subResellerItem,
          ...baseItems.slice(dashboardIndex + 1),
        ];
      }
    }
    
    if (user?.role === "customer" && user?.resellerId) {
      const ordiniIndex = baseItems.findIndex(item => item.url === "/customer/orders");
      if (ordiniIndex !== -1) {
        const shopItem = { 
          title: "sidebar.items.shopOnline", 
          url: `/shop/${user.resellerId}`, 
          icon: Store, 
          group: "Acquisti" 
        };
        return [
          ...baseItems.slice(0, ordiniIndex),
          shopItem,
          ...baseItems.slice(ordiniIndex),
        ];
      }
    }
    
    return baseItems;
  }, [user, isReseller, isResellerStaff, isFranchisingOrGdo, hasFullAccess, canAccessModule, actingAs, hasFeature, hasAllFeatures, isLicenseReseller]);
  
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const findActiveGroup = () => {
    for (const [group, groupItems] of Object.entries(groupedItems)) {
      if (groupItems.some(item => location === item.url || location.startsWith(item.url + "/"))) {
        return group;
      }
    }
    if (isReseller || isResellerStaff || isRepairCenter) {
      for (const supplier of filteredIntegratedSuppliers) {
        if (location.startsWith(supplier.basePath)) {
          return (isReseller || isResellerStaff) ? "Magazzino e Fornitori" : "Fornitori";
        }
      }
    }
    return null;
  };

  const activeGroup = findActiveGroup();


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const setGroupOpen = (group: string, isOpen: boolean) => {
    setOpenGroups(prev => ({ ...prev, [group]: isOpen }));
  };

  const setSupplierOpen = (key: string, isOpen: boolean) => {
    setOpenSuppliers(prev => ({ ...prev, [key]: isOpen }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isGroupOpen = (group: string) => {
    return openGroups[group] === true;
  };

  const translateGroup = (group: string) => {
    const key = groupTranslationKeys[group];
    return key ? t(key) : group;
  };

  if (!user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        {sidebarLogoUrl ? (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 rounded-xl blur-sm" />
              <Avatar className="relative h-11 w-11 rounded-xl shadow-lg ring-2 ring-emerald-500/30">
                <AvatarImage src={sidebarLogoUrl} alt={sidebarLogoName || ''} className="object-contain" />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-bold">
                  {getInitials(sidebarLogoName || '')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm block truncate">
                {sidebarLogoName}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-teal-500/20 rounded-xl blur-sm" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-500/30">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm tracking-tight">MonkeyPlan</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      {isReseller && (
        <div className="px-3 py-2 border-b border-sidebar-border/50">
          <ContextSwitcher />
        </div>
      )}

      <SidebarContent>
        {Object.entries(groupedItems).map(([group, groupItems]) => {
          const GroupIcon = groupIcons[group] || LayoutDashboard;
          const isOpen = isGroupOpen(group);
          const hasActiveItem = groupItems.some(item => location === item.url || location.startsWith(item.url + "/"));
          
          if (group === "Dashboard" || group === "Principale" || group === "Sub-Reseller" || groupItems.length === 1) {
            return (
              <SidebarGroup key={group} className="px-3 py-2">
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive} 
                          className={`px-3 py-2.5 rounded-xl ${isActive ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20" : "hover-elevate"}`}
                        >
                          <Link 
                            href={item.url} 
                            onClick={handleLinkClick}
                            data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon className={`h-4 w-4 ${isActive ? "text-white" : ""}`} />
                            <span className={`font-semibold ${isActive ? "text-white" : ""}`}>{t(item.title)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            );
          }
          
          return (
            <SidebarGroup key={group} className="px-3 py-0.5">
              <Collapsible open={isOpen} onOpenChange={(open) => setGroupOpen(group, open)}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    className={`w-full px-3 py-2.5 rounded-xl hover-elevate ${hasActiveItem && !isOpen ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20" : ""}`}
                    data-testid={`button-group-${group.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${hasActiveItem ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20" : "bg-sidebar-accent/50"}`}>
                      <GroupIcon className={`h-3.5 w-3.5 ${hasActiveItem ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`flex-1 text-left font-medium ${hasActiveItem ? "text-foreground" : "text-muted-foreground"}`}>
                      {translateGroup(group)}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="ml-7 mt-1.5 border-l border-sidebar-border/40 pl-0.5">
                      {groupItems.map((item, idx) => {
                        const isActive = location === item.url || location.startsWith(item.url + "/");
                        const currentSection = (item as any).section;
                        const prevSection = idx > 0 ? (groupItems[idx - 1] as any).section : undefined;
                        const showSectionLabel = currentSection && currentSection !== prevSection;
                        return (
                          <div key={item.title}>
                            {showSectionLabel && (
                              <div className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 ${idx > 0 ? "mt-2 pt-2 mx-1 border-t border-sidebar-border/30" : ""}`}>
                                {t(currentSection)}
                              </div>
                            )}
                            <SidebarMenuItem>
                              <SidebarMenuButton 
                                asChild 
                                isActive={isActive} 
                                className={`pl-3 py-2 rounded-lg ${isActive ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground hover-elevate"}`}
                              >
                                <Link 
                                  href={item.url} 
                                  onClick={handleLinkClick}
                                  data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                                >
                                  <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
                                  <span className="flex-1 text-[13px]">{t(item.title)}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </div>
                        );
                      })}
                      
                      {(group === "Fornitori" || group === "Magazzino e Fornitori") && ((isReseller || isResellerStaff) && canAccessModule("suppliers") || isRepairCenter) && filteredIntegratedSuppliers.length > 0 && (
                        <>
                          <div className="my-2 mx-2 border-t border-sidebar-border" />
                          <div className="px-4 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {t("sidebar.sections.integratedSuppliers")}
                          </div>
                          {filteredIntegratedSuppliers.map((supplier) => {
                            const isSupplierActive = location.startsWith(supplier.basePath);
                            const isSupplierOpen = openSuppliers[supplier.key] ?? isSupplierActive;
                            
                            return (
                              <Collapsible 
                                key={supplier.key} 
                                open={isSupplierOpen}
                                onOpenChange={(open) => setSupplierOpen(supplier.key, open)}
                              >
                                <SidebarMenuItem>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton 
                                      className="w-full justify-between pl-4"
                                      data-testid={`button-supplier-${supplier.key}`}
                                    >
                                      <span className="font-medium">{t(supplier.label)}</span>
                                      <ChevronDown 
                                        className={`h-4 w-4 transition-transform duration-200 ${isSupplierOpen ? "rotate-180" : ""}`} 
                                      />
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenu className="ml-4 border-l border-sidebar-border pl-2">
                                      {supplier.routes.map((route) => {
                                        const fullUrl = supplier.basePath + route.path;
                                        const isRouteActive = location === fullUrl;
                                        return (
                                          <SidebarMenuItem key={route.path}>
                                            <SidebarMenuButton asChild isActive={isRouteActive}>
                                              <Link 
                                                href={fullUrl}
                                                onClick={handleLinkClick}
                                                data-testid={`link-${supplier.key}-${route.title.toLowerCase()}`}
                                              >
                                                <route.icon className="h-4 w-4" />
                                                <span>{t(route.title)}</span>
                                              </Link>
                                            </SidebarMenuButton>
                                          </SidebarMenuItem>
                                        );
                                      })}
                                    </SidebarMenu>
                                  </CollapsibleContent>
                                </SidebarMenuItem>
                              </Collapsible>
                            );
                          })}
                        </>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/10 backdrop-blur-sm">
          <div className="relative">
            <Avatar className="h-10 w-10 shadow-md ring-2 ring-emerald-500/20">
              <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-emerald-700 dark:text-emerald-300">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 rounded-xl"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
