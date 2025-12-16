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
  Stethoscope,
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
  ExternalLink,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, Fragment } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { ContextSwitcher } from "@/components/ContextSwitcher";

// Menu items per ruolo
const menuItems = {
  admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Principale" },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3, group: "Principale" },
    { title: "Clienti", url: "/admin/customers", icon: Users, group: "Principale" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Principale" },
    { title: "Team Rivenditori", url: "/admin/reseller-teams", icon: UsersRound, group: "Principale" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri" },
    // { title: "Diagnosi", url: "/admin/diagnostics", icon: Stethoscope, group: "Centri" },
    // { title: "Preventivi", url: "/admin/quotes", icon: Receipt, group: "Centri" },
    { title: "Catalogo Interventi", url: "/admin/service-catalog", icon: Wrench, group: "Centri" },
    { title: "Magazzino", url: "/admin/inventory", icon: Package, group: "Magazzino" },
    { title: "Prodotti", url: "/admin/products", icon: ShoppingCart, group: "Magazzino" },
    { title: "Fornitori", url: "/admin/suppliers", icon: Building2, group: "Magazzino" },
    { title: "Integrazioni API", url: "/admin/external-integrations", icon: Plug, group: "Sistema" },
    { title: "Ordini Fornitori", url: "/admin/supplier-orders", icon: Truck, group: "Magazzino" },
    { title: "Resi Fornitori", url: "/admin/supplier-returns", icon: Undo2, group: "Magazzino" },
    { title: "Ordini Ricambi", url: "/admin/parts-orders", icon: Truck, group: "Magazzino" },
    { title: "Carico Ricambi", url: "/admin/parts-load", icon: ClipboardList, group: "Magazzino" },
    { title: "Utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Fatture", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Activity Logs", url: "/admin/activity-logs", icon: Shield, group: "Sistema" },
    { title: "Impostazioni", url: "/admin/settings", icon: Settings, group: "Sistema" },
    { title: "Team Admin", url: "/admin/team", icon: UsersRound, group: "Sistema" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
  ],
  admin_staff: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Principale" },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3, group: "Principale" },
    { title: "Clienti", url: "/admin/customers", icon: Users, group: "Principale" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Principale" },
    { title: "Team Rivenditori", url: "/admin/reseller-teams", icon: UsersRound, group: "Principale" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri" },
    { title: "Catalogo Interventi", url: "/admin/service-catalog", icon: Wrench, group: "Centri" },
    { title: "Magazzino", url: "/admin/inventory", icon: Package, group: "Magazzino" },
    { title: "Prodotti", url: "/admin/products", icon: ShoppingCart, group: "Magazzino" },
    { title: "Fornitori", url: "/admin/suppliers", icon: Building2, group: "Magazzino" },
    { title: "Ordini Fornitori", url: "/admin/supplier-orders", icon: Truck, group: "Magazzino" },
    { title: "Resi Fornitori", url: "/admin/supplier-returns", icon: Undo2, group: "Magazzino" },
    { title: "Ordini Ricambi", url: "/admin/parts-orders", icon: Truck, group: "Magazzino" },
    { title: "Carico Ricambi", url: "/admin/parts-load", icon: ClipboardList, group: "Magazzino" },
    { title: "Utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Fatture", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
  ],
  reseller: [
    { title: "Dashboard", url: "/reseller", icon: LayoutDashboard, group: "Principale" },
    { title: "Clienti", url: "/reseller/customers", icon: Users, group: "Gestione" },
    { title: "Team", url: "/reseller/team", icon: UsersRound, group: "Gestione" },
    { title: "Centri Riparazione", url: "/reseller/repair-centers", icon: Building, group: "Gestione" },
    { title: "Appuntamenti", url: "/reseller/appointments", icon: CalendarCheck, group: "Gestione" },
    { title: "Lavorazioni", url: "/reseller/repairs", icon: Wrench, group: "Riparazioni" },
    { title: "Catalogo Interventi", url: "/reseller/service-catalog", icon: Wrench, group: "Riparazioni" },
    { title: "Magazzino", url: "/reseller/inventory", icon: Package, group: "Inventario" },
    { title: "Prodotti", url: "/reseller/products", icon: Package, group: "Inventario" },
    { title: "Fornitori", url: "/reseller/suppliers", icon: Truck, group: "Fornitori" },
    { title: "Ordini Ricambi", url: "/reseller/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    { title: "Resi Fornitori", url: "/reseller/supplier-returns", icon: RotateCcw, group: "Fornitori" },
    { title: "Carico Ricambi", url: "/reseller/parts-load", icon: ClipboardList, group: "Fornitori" },
    { title: "Fatture", url: "/reseller/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Report", url: "/reseller/reports", icon: BarChart3, group: "Fatturazione" },
    { title: "Utility", url: "/reseller/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/reseller/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/reseller/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/reseller/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/reseller/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/reseller/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Ticket", url: "/reseller/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Catalogo Dispositivi", url: "/reseller/device-catalog", icon: Smartphone, group: "Impostazioni" },
  ],
  repair_center: [
    { title: "Dashboard", url: "/repair-center", icon: LayoutDashboard, group: "Principale" },
    { title: "Lavorazioni", url: "/repair-center/repairs", icon: Wrench, group: "Principale" },
    { title: "Appuntamenti", url: "/repair-center/appointments", icon: CalendarCheck, group: "Principale" },
    // { title: "Diagnosi", url: "/repair-center/diagnostics", icon: Stethoscope, group: "Principale" },
    // { title: "Preventivi", url: "/repair-center/quotes", icon: Receipt, group: "Principale" },
    { title: "Magazzino", url: "/repair-center/inventory", icon: Package, group: "Magazzino" },
    { title: "Ticket", url: "/repair-center/tickets", icon: Ticket, group: "Assistenza" },
  ],
  customer: [
    { title: "Dashboard", url: "/customer", icon: LayoutDashboard, group: "Principale" },
    { title: "Riparazioni", url: "/customer/repairs", icon: Wrench, group: "Le mie riparazioni" },
    { title: "Ticket", url: "/customer/tickets", icon: Ticket, group: "Assistenza" },
  ],
};

// Fornitori integrati - mostrati dentro la sezione Fornitori
const integratedSuppliers = [
  {
    key: "sifar",
    label: "SIFAR",
    basePath: "/reseller/sifar",
    routes: [
      { title: "Catalogo", path: "/catalog", icon: Package },
      { title: "Carrello", path: "/cart", icon: ShoppingCart },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "foneday",
    label: "Foneday EU",
    basePath: "/reseller/foneday",
    routes: [
      { title: "Catalogo", path: "/catalog", icon: Package },
      { title: "Carrello", path: "/cart", icon: ShoppingCart },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "mobilesentrix",
    label: "MobileSentrix",
    basePath: "/reseller/mobilesentrix",
    routes: [
      { title: "Catalogo", path: "/catalog", icon: Package },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleSupplier = (key: string) => {
    setOpenSuppliers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) return null;

  const items = menuItems[user.role as keyof typeof menuItems] || [];
  const isReseller = user.role === "reseller";
  
  // Raggruppa items per gruppo
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Monkey Plan <span className="text-red-500">Beta</span></h2>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      {isReseller && (
        <div className="py-3 border-b border-sidebar-border">
          <ContextSwitcher />
        </div>
      )}

      <SidebarContent>
        {Object.entries(groupedItems).map(([group, groupItems]) => (
          <Fragment key={group}>
            <SidebarGroup>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link 
                            href={item.url} 
                            onClick={handleLinkClick}
                            data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  {/* Fornitori Integrati - mostrati dentro la sezione Fornitori */}
                  {group === "Fornitori" && isReseller && (
                    <>
                      <div className="my-2 mx-2 border-t border-sidebar-border" />
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Fornitori Integrati
                      </div>
                      {integratedSuppliers.map((supplier) => {
                        const isSupplierActive = location.startsWith(supplier.basePath);
                        const isOpen = openSuppliers[supplier.key] ?? isSupplierActive;
                        
                        return (
                          <Collapsible 
                            key={supplier.key} 
                            open={isOpen}
                            onOpenChange={() => toggleSupplier(supplier.key)}
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton 
                                  className="w-full justify-between"
                                  data-testid={`button-supplier-${supplier.key}`}
                                >
                                  <span className="font-medium">{supplier.label}</span>
                                  <ChevronDown 
                                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
                                  />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenu className="ml-4 mt-1 border-l border-sidebar-border pl-2">
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
                                            <span>{route.title}</span>
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
            </SidebarGroup>
          </Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
