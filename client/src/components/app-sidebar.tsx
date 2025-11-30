import {
  LayoutDashboard,
  Users,
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
  ClipboardList,
  Zap,
  Phone,
  FileCheck,
  Coins,
  PieChart,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

// Menu items per ruolo
const menuItems = {
  admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Principale" },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3, group: "Principale" },
    { title: "Utenti", url: "/admin/users", icon: Users, group: "Principale" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Principale" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri" },
    { title: "Diagnosi", url: "/admin/diagnostics", icon: Stethoscope, group: "Centri" },
    { title: "Preventivi", url: "/admin/quotes", icon: Receipt, group: "Centri" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
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
    { title: "Activity Logs", url: "/admin/activity-logs", icon: Shield, group: "Sistema" },
    { title: "Impostazioni", url: "/admin/settings", icon: Settings, group: "Sistema" },
  ],
  reseller: [
    { title: "Dashboard", url: "/reseller", icon: LayoutDashboard, group: "Principale" },
    { title: "Ordini", url: "/reseller/orders", icon: ShoppingCart, group: "Principale" },
    { title: "Clienti", url: "/reseller/customers", icon: Users, group: "Gestione" },
    { title: "Nuova Riparazione", url: "/reseller/new-repair", icon: Wrench, group: "Riparazioni" },
    { title: "Utility", url: "/reseller/utility", icon: Zap, group: "Utility" },
    { title: "Pratiche", url: "/reseller/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/reseller/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Ticket", url: "/reseller/tickets", icon: Ticket, group: "Assistenza" },
  ],
  repair_center: [
    { title: "Dashboard", url: "/repair-center", icon: LayoutDashboard, group: "Principale" },
    { title: "Lavorazioni", url: "/repair-center/repairs", icon: Wrench, group: "Principale" },
    { title: "Diagnosi", url: "/repair-center/diagnostics", icon: Stethoscope, group: "Principale" },
    { title: "Preventivi", url: "/repair-center/quotes", icon: Receipt, group: "Principale" },
    { title: "Magazzino", url: "/repair-center/inventory", icon: Package, group: "Magazzino" },
    { title: "Ticket", url: "/repair-center/tickets", icon: Ticket, group: "Assistenza" },
  ],
  customer: [
    { title: "Dashboard", url: "/customer", icon: LayoutDashboard, group: "Principale" },
    { title: "Riparazioni", url: "/customer/repairs", icon: Wrench, group: "Le mie riparazioni" },
    { title: "Ticket", url: "/customer/tickets", icon: Ticket, group: "Assistenza" },
  ],
};

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const items = menuItems[user.role as keyof typeof menuItems] || [];
  
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
            <h2 className="text-lg font-semibold">MonkeyPlan</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedItems).map(([group, groupItems]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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
