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
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { ContextSwitcher } from "@/components/ContextSwitcher";

const menuItems = {
  admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Dashboard" },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3, group: "Dashboard" },
    { title: "Clienti", url: "/admin/customers", icon: Users, group: "Clienti & Rivenditori" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Clienti & Rivenditori" },
    { title: "Team Rivenditori", url: "/admin/reseller-teams", icon: UsersRound, group: "Clienti & Rivenditori" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "Catalogo Interventi", url: "/admin/service-catalog", icon: Receipt, group: "Centri & Riparazioni" },
    { title: "Il Mio Magazzino", url: "/admin/warehouses", icon: Warehouse, group: "Magazzino & Fornitori" },
    { title: "Tutti i Magazzini", url: "/admin/all-warehouses", icon: Building2, group: "Magazzino & Fornitori" },
    { title: "Ricambi", url: "/admin/products", icon: Package, group: "Magazzino & Fornitori" },
    { title: "Smartphone", url: "/admin/smartphone-catalog", icon: Smartphone, group: "Magazzino & Fornitori" },
    { title: "Accessori", url: "/admin/accessory-catalog", icon: ShoppingCart, group: "Magazzino & Fornitori" },
    { title: "Fornitori", url: "/admin/suppliers", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Ordini Fornitori", url: "/admin/supplier-orders", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Resi Fornitori", url: "/admin/supplier-returns", icon: Undo2, group: "Magazzino & Fornitori" },
    { title: "Ordini Ricambi", url: "/admin/parts-orders", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Carico Ricambi", url: "/admin/parts-load", icon: ClipboardList, group: "Magazzino & Fornitori" },
    { title: "Fatture", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Integrazioni API", url: "/admin/external-integrations", icon: Plug, group: "Sistema" },
    { title: "Activity Logs", url: "/admin/activity-logs", icon: Shield, group: "Sistema" },
    { title: "Impostazioni", url: "/admin/settings", icon: Settings, group: "Sistema" },
    { title: "Team Admin", url: "/admin/team", icon: UsersRound, group: "Sistema" },
    { title: "Assegnazione Prodotti", url: "/admin/product-assignments", icon: Store, group: "E-commerce" },
    { title: "Admin Shop", url: "/shop/admin", icon: ShoppingCart, group: "E-commerce" },
    { title: "Marketplace", url: "/marketplace", icon: Store, group: "E-commerce" },
    { title: "Ordini B2C", url: "/admin/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    { title: "Ordini B2B Reseller", url: "/admin/b2b-orders", icon: Package, group: "E-commerce" },
    { title: "Ordini B2B Centri Rip.", url: "/admin/rc-b2b-orders", icon: Building, group: "E-commerce" },
    { title: "Resi B2B", url: "/admin/b2b-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "Spedizioni", url: "/admin/shipments", icon: Truck, group: "E-commerce" },
    { title: "Pagamenti", url: "/admin/payments", icon: CreditCard, group: "E-commerce" },
    { title: "Resi", url: "/admin/sales-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
  ],
  admin_staff: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Dashboard" },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3, group: "Dashboard" },
    { title: "Clienti", url: "/admin/customers", icon: Users, group: "Clienti & Rivenditori" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Clienti & Rivenditori" },
    { title: "Team Rivenditori", url: "/admin/reseller-teams", icon: UsersRound, group: "Clienti & Rivenditori" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "Catalogo Interventi", url: "/admin/service-catalog", icon: Receipt, group: "Centri & Riparazioni" },
    { title: "Il Mio Magazzino", url: "/admin/warehouses", icon: Warehouse, group: "Magazzino & Fornitori" },
    { title: "Tutti i Magazzini", url: "/admin/all-warehouses", icon: Building2, group: "Magazzino & Fornitori" },
    { title: "Ricambi", url: "/admin/products", icon: Package, group: "Magazzino & Fornitori" },
    { title: "Smartphone", url: "/admin/smartphone-catalog", icon: Smartphone, group: "Magazzino & Fornitori" },
    { title: "Accessori", url: "/admin/accessory-catalog", icon: ShoppingCart, group: "Magazzino & Fornitori" },
    { title: "Fornitori", url: "/admin/suppliers", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Ordini Fornitori", url: "/admin/supplier-orders", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Resi Fornitori", url: "/admin/supplier-returns", icon: Undo2, group: "Magazzino & Fornitori" },
    { title: "Ordini Ricambi", url: "/admin/parts-orders", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Carico Ricambi", url: "/admin/parts-load", icon: ClipboardList, group: "Magazzino & Fornitori" },
    { title: "Fatture", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Assegnazione Prodotti", url: "/admin/product-assignments", icon: Store, group: "E-commerce" },
    { title: "Admin Shop", url: "/shop/admin", icon: ShoppingCart, group: "E-commerce" },
    { title: "Marketplace", url: "/marketplace", icon: Store, group: "E-commerce" },
    { title: "Ordini B2C", url: "/admin/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    { title: "Spedizioni", url: "/admin/shipments", icon: Truck, group: "E-commerce" },
    { title: "Pagamenti", url: "/admin/payments", icon: CreditCard, group: "E-commerce" },
    { title: "Resi", url: "/admin/sales-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
  ],
  reseller: [
    { title: "Dashboard", url: "/reseller", icon: LayoutDashboard, group: "Dashboard" },
    { title: "Clienti", url: "/reseller/customers", icon: Users, group: "Clienti & Team" },
    { title: "Team", url: "/reseller/team", icon: UsersRound, group: "Clienti & Team" },
    { title: "Appuntamenti", url: "/reseller/appointments", icon: CalendarCheck, group: "Clienti & Team" },
    { title: "Centri Riparazione", url: "/reseller/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "Lavorazioni", url: "/reseller/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "Catalogo Interventi", url: "/reseller/service-catalog", icon: Receipt, group: "Centri & Riparazioni" },
    { title: "Catalogo Dispositivi", url: "/reseller/device-catalog", icon: Smartphone, group: "Centri & Riparazioni" },
    { title: "Magazzino", url: "/reseller/warehouses", icon: Warehouse, group: "Magazzino & Fornitori" },
    { title: "Magazzini Rete", url: "/reseller/network-warehouses", icon: Building2, group: "Magazzino & Fornitori" },
    { title: "Ricambi", url: "/reseller/products", icon: Package, group: "Magazzino & Fornitori" },
    { title: "Smartphone", url: "/reseller/smartphone-catalog", icon: Smartphone, group: "Magazzino & Fornitori" },
    { title: "Accessori", url: "/reseller/accessory-catalog", icon: ShoppingCart, group: "Magazzino & Fornitori" },
    { title: "Fornitori", url: "/reseller/suppliers", icon: Truck, group: "Magazzino & Fornitori" },
    { title: "Ordini Ricambi", url: "/reseller/supplier-orders", icon: ShoppingCart, group: "Magazzino & Fornitori" },
    { title: "Resi Fornitori", url: "/reseller/supplier-returns", icon: RotateCcw, group: "Magazzino & Fornitori" },
    { title: "Carico Ricambi", url: "/reseller/parts-load", icon: ClipboardList, group: "Magazzino & Fornitori" },
    { title: "Fatture", url: "/reseller/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Report", url: "/reseller/reports", icon: BarChart3, group: "Fatturazione" },
    { title: "Catalogo Shop", url: "/reseller/shop-catalog", icon: Store, group: "E-commerce" },
    { title: "Ordini B2C", url: "/reseller/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    { title: "Spedizioni", url: "/reseller/shipments", icon: Truck, group: "E-commerce" },
    { title: "Pagamenti", url: "/reseller/payments", icon: CreditCard, group: "E-commerce" },
    { title: "Resi", url: "/reseller/sales-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "Catalogo B2B", url: "/reseller/b2b-catalog", icon: Package, group: "Acquisti B2B" },
    { title: "I Miei Ordini B2B", url: "/reseller/b2b-orders", icon: ShoppingCart, group: "Acquisti B2B" },
    { title: "I Miei Resi B2B", url: "/reseller/b2b-returns", icon: RotateCcw, group: "Acquisti B2B" },
    { title: "Ordini Centri Rip.", url: "/reseller/rc-b2b-orders", icon: Building2, group: "Acquisti B2B" },
    { title: "Catalogo Marketplace", url: "/reseller/marketplace", icon: Store, group: "Marketplace P2P" },
    { title: "I Miei Acquisti", url: "/reseller/marketplace-orders", icon: ShoppingCart, group: "Marketplace P2P" },
    { title: "Le Mie Vendite", url: "/reseller/marketplace-sales", icon: TrendingUp, group: "Marketplace P2P" },
    { title: "Utility", url: "/reseller/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/reseller/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/reseller/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/reseller/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/reseller/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/reseller/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Ticket", url: "/reseller/tickets", icon: Ticket, group: "Assistenza" },
  ],
  repair_center: [
    { title: "Dashboard", url: "/repair-center", icon: LayoutDashboard, group: "Principale" },
    { title: "Lavorazioni", url: "/repair-center/repairs", icon: Wrench, group: "Principale" },
    { title: "Appuntamenti", url: "/repair-center/appointments", icon: CalendarCheck, group: "Principale" },
    { title: "Magazzino", url: "/repair-center/warehouses", icon: Warehouse, group: "Magazzino" },
    { title: "Prodotti", url: "/repair-center/products", icon: Package, group: "Magazzino" },
    { title: "Smartphone", url: "/repair-center/smartphone-catalog", icon: Smartphone, group: "Cataloghi" },
    { title: "Accessori", url: "/repair-center/accessory-catalog", icon: ShoppingCart, group: "Cataloghi" },
    { title: "Ricambi", url: "/repair-center/spare-parts-catalog", icon: Wrench, group: "Cataloghi" },
    { title: "Clienti", url: "/repair-center/customers", icon: Users, group: "Gestione" },
    { title: "Impostazioni", url: "/repair-center/settings", icon: Settings, group: "Gestione" },
    { title: "Catalogo B2B", url: "/repair-center/b2b-catalog", icon: ShoppingCart, group: "Acquisti B2B" },
    { title: "Ordini B2B", url: "/repair-center/b2b-orders", icon: FileText, group: "Acquisti B2B" },
    { title: "Resi B2B", url: "/repair-center/b2b-returns", icon: RotateCcw, group: "Acquisti B2B" },
    { title: "Marketplace Rivenditori", url: "/repair-center/marketplace", icon: Store, group: "Marketplace" },
    { title: "Ticket", url: "/repair-center/tickets", icon: Ticket, group: "Assistenza" },
  ],
  customer: [
    { title: "Dashboard", url: "/customer", icon: LayoutDashboard, group: "Principale" },
    { title: "Riparazioni", url: "/customer/repairs", icon: Wrench, group: "Le mie riparazioni" },
    { title: "Ordini", url: "/customer/orders", icon: ShoppingCart, group: "Acquisti" },
    { title: "Resi", url: "/customer/sales-returns", icon: RotateCcw, group: "Acquisti" },
    { title: "Ticket", url: "/customer/tickets", icon: Ticket, group: "Assistenza" },
  ],
};

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

const groupIcons: Record<string, typeof LayoutDashboard> = {
  "Dashboard": LayoutDashboard,
  "Clienti & Rivenditori": Users,
  "Clienti & Team": Users,
  "Centri & Riparazioni": Wrench,
  "Magazzino & Fornitori": Package,
  "Sistema": Settings,
  "Utility": Zap,
  "Fatturazione": FileText,
  "E-commerce": ShoppingCart,
  "Assistenza": Ticket,
  "Principale": LayoutDashboard,
  "Magazzino": Package,
  "Le mie riparazioni": Wrench,
};

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});

  const isReseller = user?.role === "reseller";
  const isFranchisingOrGdo = user?.resellerCategory === "franchising" || user?.resellerCategory === "gdo";

  // Query sub-resellers for franchising/gdo resellers
  const { data: subResellers = [] } = useQuery<any[]>({
    queryKey: ["/api/reseller/sub-resellers"],
    enabled: isReseller && isFranchisingOrGdo,
  });

  const hasSubResellers = subResellers.length > 0;

  // Build menu items dynamically based on sub-resellers
  const items = useMemo(() => {
    const baseItems = user ? (menuItems[user.role as keyof typeof menuItems] || []) : [];
    
    if (isReseller && hasSubResellers) {
      // Add Sub-Reseller item after Team in "Clienti & Team" group
      const teamIndex = baseItems.findIndex(item => item.title === "Team");
      if (teamIndex !== -1) {
        const subResellerItem = { 
          title: "Sub-Reseller", 
          url: "/reseller/sub-resellers", 
          icon: Network, 
          group: "Clienti & Team" 
        };
        return [
          ...baseItems.slice(0, teamIndex + 1),
          subResellerItem,
          ...baseItems.slice(teamIndex + 1),
        ];
      }
    }
    
    return baseItems;
  }, [user, isReseller, hasSubResellers]);
  
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
    if (isReseller) {
      for (const supplier of integratedSuppliers) {
        if (location.startsWith(supplier.basePath)) {
          return "Magazzino & Fornitori";
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

  if (!user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Monkey Plan <span className="text-red-500">Beta v.20</span></h2>
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
        {Object.entries(groupedItems).map(([group, groupItems]) => {
          const GroupIcon = groupIcons[group] || LayoutDashboard;
          const isOpen = isGroupOpen(group);
          const hasActiveItem = groupItems.some(item => location === item.url || location.startsWith(item.url + "/"));
          
          // Dashboard group: render items directly without collapsible
          if (group === "Dashboard" || group === "Principale") {
            return (
              <SidebarGroup key={group} className="py-1">
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const isActive = location === item.url || location.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} className="px-4 py-2.5">
                          <Link 
                            href={item.url} 
                            onClick={handleLinkClick}
                            data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="font-medium">{item.title}</span>
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
            <SidebarGroup key={group} className="py-0">
              <Collapsible open={isOpen} onOpenChange={(open) => setGroupOpen(group, open)}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    className="w-full px-4 py-2.5 hover-elevate"
                    data-testid={`button-group-${group.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span className={`flex-1 text-left font-medium ${hasActiveItem ? "text-sidebar-primary" : ""}`}>
                      {group}
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="ml-4 border-l border-sidebar-border">
                      {groupItems.map((item) => {
                        const isActive = location === item.url || location.startsWith(item.url + "/");
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive} className="pl-4">
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
                      
                      {group === "Magazzino & Fornitori" && isReseller && (
                        <>
                          <div className="my-2 mx-2 border-t border-sidebar-border" />
                          <div className="px-4 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Fornitori Integrati
                          </div>
                          {integratedSuppliers.map((supplier) => {
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
                                      <span className="font-medium">{supplier.label}</span>
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
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
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
