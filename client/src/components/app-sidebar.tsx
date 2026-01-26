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
import { useStaffPermissions, getRequiredModuleForUrl } from "@/hooks/use-staff-permissions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { ContextSwitcher } from "@/components/ContextSwitcher";

// Type for context response
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
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Dashboard" },
    { title: "Panoramica POS", url: "/admin/pos", icon: Receipt, group: "POS" },
    { title: "Clienti", url: "/admin/customers", icon: Users, group: "Clienti & Rivenditori" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Clienti & Rivenditori" },
    { title: "Team Rivenditori", url: "/admin/reseller-teams", icon: UsersRound, group: "Clienti & Rivenditori" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "Utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Il Mio Magazzino", url: "/admin/warehouses", icon: Warehouse, group: "Magazzino" },
    { title: "Tutti i Magazzini", url: "/admin/all-warehouses", icon: Building2, group: "Magazzino" },
    { title: "Ricambi", url: "/admin/products", icon: Package, group: "Magazzino" },
    { title: "Dispositivi", url: "/admin/dispositivi", icon: Smartphone, group: "Magazzino" },
    { title: "Accessori", url: "/admin/accessory-catalog", icon: ShoppingCart, group: "Magazzino" },
    { title: "Panoramica", url: "/admin/transfer-requests/overview", icon: ArrowRightLeft, group: "Interscambio" },
    { title: "Tutte le Richieste", url: "/admin/transfer-requests", icon: Inbox, group: "Interscambio" },
    { title: "Anagrafica Fornitori", url: "/admin/suppliers", icon: Truck, group: "Fornitori" },
    { title: "Ordini a Fornitori", url: "/admin/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    { title: "Resi a Fornitori", url: "/admin/supplier-returns", icon: Undo2, group: "Fornitori" },
    { title: "Fatture", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    // E-commerce - Catalogo
    { title: "Assegnazione Reseller", url: "/admin/product-assignments", icon: Store, group: "E-commerce" },
    // E-commerce - Ordini
    { title: "Ordini Clienti", url: "/admin/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    { title: "Ordini Reseller", url: "/admin/b2b-orders", icon: Network, group: "E-commerce" },
    { title: "Ordini Centri Rip.", url: "/admin/rc-b2b-orders", icon: Building, group: "E-commerce" },
    // E-commerce - Resi
    { title: "Resi Clienti", url: "/admin/sales-returns", icon: RotateCcw, group: "E-commerce" },
    { title: "Resi B2B", url: "/admin/b2b-returns", icon: Undo2, group: "E-commerce" },
    // E-commerce - Operazioni
    { title: "Spedizioni", url: "/admin/shipments", icon: Truck, group: "E-commerce" },
    { title: "Pagamenti", url: "/admin/payments", icon: CreditCard, group: "E-commerce" },
    { title: "Ferie/Permessi", url: "/admin/hr/leave-requests", icon: Calendar, group: "Risorse Umane" },
    { title: "Malattie", url: "/admin/hr/sick-leave", icon: Stethoscope, group: "Risorse Umane" },
    { title: "Note Spese", url: "/admin/hr/expenses", icon: Receipt, group: "Risorse Umane" },
    { title: "Presenze", url: "/admin/hr/attendance", icon: Clock, group: "Risorse Umane" },
    { title: "Calendario HR", url: "/admin/hr/calendar", icon: Calendar, group: "Risorse Umane" },
    { title: "Catalogo Dispositivi", url: "/admin/device-catalog", icon: Package, group: "Sistema" },
    { title: "Compatibilità Dispositivi", url: "/admin/device-compatibilities", icon: Link2, group: "Sistema" },
    { title: "Listino Prezzi", url: "/admin/service-catalog", icon: Receipt, group: "Sistema" },
    { title: "Prodotti Garanzia", url: "/admin/warranty-products", icon: Shield, group: "Garanzie" },
    { title: "Analytics Garanzie", url: "/admin/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    { title: "Categorie Utility", url: "/admin/utility-categories", icon: FolderOpen, group: "Sistema" },
    { title: "Integrazioni API", url: "/admin/external-integrations", icon: Plug, group: "Sistema" },
    { title: "Activity Logs", url: "/admin/activity-logs", icon: Shield, group: "Sistema" },
    { title: "Motivi Irriparabilità", url: "/admin/unrepairable-reasons", icon: AlertTriangle, group: "Sistema" },
    { title: "Impostazioni Diagnosi", url: "/admin/diagnosis-settings", icon: Settings, group: "Sistema" },
    { title: "Impostazioni", url: "/admin/settings", icon: Settings, group: "Sistema" },
    { title: "Team Admin", url: "/admin/team", icon: UsersRound, group: "Sistema" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
    { title: "Richieste Remote", url: "/admin/remote-requests", icon: Send, group: "Centri & Riparazioni" },
  ],
  admin_staff: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Dashboard" },
    { title: "Clienti", url: "/admin/customers", icon: Users, group: "Clienti & Rivenditori" },
    { title: "Rivenditori", url: "/admin/resellers", icon: Store, group: "Clienti & Rivenditori" },
    { title: "Team Rivenditori", url: "/admin/reseller-teams", icon: UsersRound, group: "Clienti & Rivenditori" },
    { title: "Centri di Riparazione", url: "/admin/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "Lavorazioni", url: "/admin/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "Utility", url: "/admin/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/admin/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/admin/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/admin/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/admin/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/admin/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Il Mio Magazzino", url: "/admin/warehouses", icon: Warehouse, group: "Magazzino" },
    { title: "Tutti i Magazzini", url: "/admin/all-warehouses", icon: Building2, group: "Magazzino" },
    { title: "Ricambi", url: "/admin/products", icon: Package, group: "Magazzino" },
    { title: "Dispositivi", url: "/admin/dispositivi", icon: Smartphone, group: "Magazzino" },
    { title: "Accessori", url: "/admin/accessory-catalog", icon: ShoppingCart, group: "Magazzino" },
    { title: "Panoramica", url: "/admin/transfer-requests/overview", icon: ArrowRightLeft, group: "Interscambio" },
    { title: "Tutte le Richieste", url: "/admin/transfer-requests", icon: Inbox, group: "Interscambio" },
    { title: "Anagrafica Fornitori", url: "/admin/suppliers", icon: Truck, group: "Fornitori" },
    { title: "Ordini a Fornitori", url: "/admin/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    { title: "Resi a Fornitori", url: "/admin/supplier-returns", icon: Undo2, group: "Fornitori" },
    { title: "Fatture", url: "/admin/invoices", icon: FileText, group: "Fatturazione" },
    // E-commerce - Catalogo
    { title: "Assegnazione Reseller", url: "/admin/product-assignments", icon: Store, group: "E-commerce" },
    // E-commerce - Ordini
    { title: "Ordini Clienti", url: "/admin/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    // E-commerce - Resi
    { title: "Resi Clienti", url: "/admin/sales-returns", icon: RotateCcw, group: "E-commerce" },
    // E-commerce - Operazioni
    { title: "Spedizioni", url: "/admin/shipments", icon: Truck, group: "E-commerce" },
    { title: "Pagamenti", url: "/admin/payments", icon: CreditCard, group: "E-commerce" },
    { title: "Catalogo Dispositivi", url: "/admin/device-catalog", icon: Package, group: "Sistema" },
    { title: "Compatibilità Dispositivi", url: "/admin/device-compatibilities", icon: Link2, group: "Sistema" },
    { title: "Listino Prezzi", url: "/admin/service-catalog", icon: Receipt, group: "Sistema" },
    { title: "Ticket", url: "/admin/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, group: "Assistenza" },
  ],
  reseller: [
    { title: "Dashboard", url: "/reseller", icon: LayoutDashboard, group: "Dashboard" },
    { title: "Panoramica POS", url: "/reseller/pos", icon: Receipt, group: "POS" },
    { title: "Storico Vendite", url: "/reseller/pos/sales-history", icon: ShoppingCart, group: "POS" },
    { title: "Storico Sessioni", url: "/reseller/pos/sessions", icon: Clock, group: "POS" },
    { title: "Gestione Casse", url: "/reseller/pos/registers", icon: Store, group: "POS" },
    { title: "Dashboard HR", url: "/reseller/hr", icon: Briefcase, group: "Gestione HR" },
    { title: "Team", url: "/reseller/team", icon: UsersRound, group: "Gestione HR" },
    { title: "Presenze", url: "/reseller/hr/attendance", icon: Clock, group: "Gestione HR" },
    { title: "Ferie e Permessi", url: "/reseller/hr/leave-requests", icon: Calendar, group: "Gestione HR" },
    { title: "Profili Orario", url: "/reseller/hr/work-profiles", icon: Settings, group: "Gestione HR" },
    { title: "Rimborsi Spese", url: "/reseller/hr/expenses", icon: ReceiptText, group: "Gestione HR" },
    { title: "Malattie", url: "/reseller/hr/sick-leave", icon: Stethoscope, group: "Gestione HR" },
    { title: "Calendario Team", url: "/reseller/hr/calendar", icon: CalendarCheck, group: "Gestione HR" },
    { title: "Centri Riparazione", url: "/reseller/repair-centers", icon: Building, group: "Centri & Riparazioni" },
    { title: "Clienti", url: "/reseller/customers", icon: Users, group: "Centri & Riparazioni" },
    { title: "Lavorazioni", url: "/reseller/repairs", icon: Wrench, group: "Centri & Riparazioni" },
    { title: "Appuntamenti", url: "/reseller/appointments", icon: CalendarCheck, group: "Centri & Riparazioni" },
    { title: "Listino Prezzi", url: "/reseller/service-catalog", icon: Receipt, group: "Centri & Riparazioni" },
    { title: "Catalogo Dispositivi", url: "/reseller/device-catalog", icon: Smartphone, group: "Centri & Riparazioni" },
    { title: "Ordini Interventi", url: "/reseller/service-orders", icon: ClipboardList, group: "Centri & Riparazioni" },
    { title: "Utility", url: "/reseller/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/reseller/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/reseller/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/reseller/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/reseller/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/reseller/utility/reports", icon: PieChart, group: "Utility" },
    { title: "Magazzino", url: "/reseller/warehouses", icon: Warehouse, group: "Magazzino" },
    { title: "Magazzini Rete", url: "/reseller/network-warehouses", icon: Building2, group: "Magazzino" },
    { title: "Ricambi", url: "/reseller/products", icon: Package, group: "Magazzino" },
    { title: "Dispositivi", url: "/reseller/dispositivi", icon: Smartphone, group: "Magazzino" },
    { title: "Accessori", url: "/reseller/accessory-catalog", icon: ShoppingCart, group: "Magazzino" },
    { title: "Panoramica", url: "/reseller/transfer-requests", icon: ArrowRightLeft, group: "Interscambio" },
    { title: "Richieste Ricevute", url: "/reseller/incoming-transfer-requests", icon: Inbox, group: "Interscambio" },
    { title: "Richieste Inviate", url: "/reseller/sub-transfer-requests", icon: Send, group: "Interscambio" },
    { title: "Anagrafica Fornitori", url: "/reseller/suppliers", icon: Truck, group: "Fornitori" },
    { title: "Ordini a Fornitori", url: "/reseller/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    { title: "Resi a Fornitori", url: "/reseller/supplier-returns", icon: RotateCcw, group: "Fornitori" },
    { title: "Panoramica Vendite", url: "/reseller/sales", icon: TrendingUp, group: "Fatturazione" },
    { title: "Fatture", url: "/reseller/invoices", icon: FileText, group: "Fatturazione" },
    { title: "Prodotti Garanzia", url: "/reseller/warranty-products", icon: Shield, group: "Garanzie" },
    { title: "Analytics Garanzie", url: "/reseller/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    { title: "Report", url: "/reseller/reports", icon: BarChart3, group: "Fatturazione" },
    // E-commerce - Catalogo
    { title: "Catalogo Shop", url: "/reseller/shop-catalog", icon: Store, group: "E-commerce" },
    // E-commerce - Ordini
    { title: "Ordini Clienti", url: "/reseller/sales-orders", icon: ShoppingCart, group: "E-commerce" },
    // E-commerce - Resi
    { title: "Resi Clienti", url: "/reseller/sales-returns", icon: RotateCcw, group: "E-commerce" },
    // E-commerce - Operazioni
    { title: "Spedizioni", url: "/reseller/shipments", icon: Truck, group: "E-commerce" },
    { title: "Pagamenti", url: "/reseller/payments", icon: CreditCard, group: "E-commerce" },
    { title: "Catalogo B2B", url: "/reseller/b2b-catalog", icon: Package, group: "Acquisti B2B" },
    { title: "I Miei Ordini B2B", url: "/reseller/b2b-orders", icon: ShoppingCart, group: "Acquisti B2B" },
    { title: "I Miei Resi B2B", url: "/reseller/b2b-returns", icon: RotateCcw, group: "Acquisti B2B" },
    { title: "Catalogo Marketplace", url: "/reseller/marketplace", icon: Store, group: "Marketplace P2P" },
    { title: "I Miei Acquisti", url: "/reseller/marketplace-orders", icon: ShoppingCart, group: "Marketplace P2P" },
    { title: "Vendite Rivenditori", url: "/reseller/marketplace-sales", icon: TrendingUp, group: "Marketplace P2P" },
    { title: "Vendite Centri Rip.", url: "/reseller/rc-b2b-orders", icon: Building2, group: "Marketplace P2P" },
    { title: "Ticket", url: "/reseller/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Guide", url: "/reseller/guide", icon: FileText, group: "Assistenza" },
    { title: "Richieste Remote", url: "/reseller/remote-requests", icon: Send, group: "Centri & Riparazioni" },
    { title: "Integrazioni", url: "/reseller/integrations", icon: Plug, group: "Account" },
    { title: "Profilo", url: "/profile", icon: UserCircle, group: "Account" },
  ],
  repair_center: [
    // Dashboard
    { title: "Dashboard", url: "/repair-center", icon: LayoutDashboard, group: "Dashboard" },
    // POS - Cassa
    { title: "Cassa POS", url: "/repair-center/pos", icon: Receipt, group: "POS" },
    { title: "Storico Vendite", url: "/repair-center/pos/sales-history", icon: ShoppingCart, group: "POS" },
    { title: "Storico Sessioni", url: "/repair-center/pos/sessions", icon: Clock, group: "POS" },
    { title: "Gestione Casse", url: "/repair-center/pos/registers", icon: Store, group: "POS" },
    // Gestione HR
    { title: "Dashboard HR", url: "/repair-center/hr", icon: Briefcase, group: "Gestione HR" },
    { title: "Team", url: "/repair-center/team", icon: UsersRound, group: "Gestione HR" },
    { title: "Presenze", url: "/repair-center/hr/attendance", icon: Clock, group: "Gestione HR" },
    { title: "Ferie e Permessi", url: "/repair-center/hr/leave-requests", icon: Calendar, group: "Gestione HR" },
    { title: "Profili Orario", url: "/repair-center/hr/work-profiles", icon: Settings, group: "Gestione HR" },
    { title: "Rimborsi Spese", url: "/repair-center/hr/expenses", icon: ReceiptText, group: "Gestione HR" },
    { title: "Malattie", url: "/repair-center/hr/sick-leave", icon: Stethoscope, group: "Gestione HR" },
    { title: "Calendario Team", url: "/repair-center/hr/calendar", icon: CalendarCheck, group: "Gestione HR" },
    // Lavorazioni
    { title: "Lavorazioni", url: "/repair-center/repairs", icon: Wrench, group: "Lavorazioni" },
    { title: "Appuntamenti", url: "/repair-center/appointments", icon: CalendarCheck, group: "Lavorazioni" },
    { title: "Listino Interventi", url: "/repair-center/service-catalog", icon: Receipt, group: "Lavorazioni" },
    { title: "Richieste Remote", url: "/repair-center/remote-requests", icon: Send, group: "Lavorazioni" },
    // Utility
    { title: "Utility", url: "/repair-center/utility", icon: Zap, group: "Utility" },
    { title: "Fornitori Utility", url: "/repair-center/utility/suppliers", icon: Phone, group: "Utility" },
    { title: "Listino Servizi", url: "/repair-center/utility/services", icon: Package, group: "Utility" },
    { title: "Pratiche", url: "/repair-center/utility/practices", icon: FileCheck, group: "Utility" },
    { title: "Compensi", url: "/repair-center/utility/commissions", icon: Coins, group: "Utility" },
    { title: "Report Utility", url: "/repair-center/utility/reports", icon: PieChart, group: "Utility" },
    // Magazzino
    { title: "Magazzino", url: "/repair-center/warehouses", icon: Warehouse, group: "Magazzino" },
    { title: "Prodotti", url: "/repair-center/products", icon: Package, group: "Magazzino" },
    // Cataloghi
    { title: "Dispositivi", url: "/repair-center/dispositivi", icon: Smartphone, group: "Cataloghi" },
    { title: "Accessori", url: "/repair-center/accessory-catalog", icon: ShoppingCart, group: "Cataloghi" },
    { title: "Ricambi", url: "/repair-center/spare-parts-catalog", icon: Wrench, group: "Cataloghi" },
    { title: "Carrello", url: "/repair-center/cart", icon: ShoppingCart, group: "Cataloghi" },
    // Garanzie
    { title: "Analytics Garanzie", url: "/repair-center/warranty-analytics", icon: BarChart3, group: "Garanzie" },
    // Acquisti B2B
    { title: "Catalogo Rivenditore", url: "/repair-center/b2b-catalog", icon: ShoppingCart, group: "Acquisti B2B" },
    { title: "Marketplace Rivenditori", url: "/repair-center/marketplace", icon: Store, group: "Acquisti B2B" },
    { title: "Ordini B2B", url: "/repair-center/b2b-orders", icon: FileText, group: "Acquisti B2B" },
    { title: "Resi B2B", url: "/repair-center/b2b-returns", icon: RotateCcw, group: "Acquisti B2B" },
    // Interscambio
    { title: "Panoramica", url: "/repair-center/transfer-requests/overview", icon: ArrowRightLeft, group: "Interscambio" },
    { title: "Nuova Richiesta", url: "/repair-center/transfer-requests", icon: Send, group: "Interscambio" },
    // Fornitori
    { title: "Anagrafica Fornitori", url: "/repair-center/suppliers", icon: Truck, group: "Fornitori" },
    { title: "Ordini a Fornitori", url: "/repair-center/supplier-orders", icon: ShoppingCart, group: "Fornitori" },
    // Gestione
    { title: "Clienti", url: "/repair-center/customers", icon: Users, group: "Gestione" },
    { title: "Fatture", url: "/repair-center/invoices", icon: FileText, group: "Gestione" },
    { title: "Impostazioni", url: "/repair-center/settings", icon: Settings, group: "Gestione" },
    // Assistenza
    { title: "Ticket", url: "/repair-center/tickets", icon: Ticket, group: "Assistenza" },
  ],
  customer: [
    { title: "Dashboard", url: "/customer", icon: LayoutDashboard, group: "Principale" },
    { title: "Ticket", url: "/customer/tickets", icon: Ticket, group: "Assistenza" },
    { title: "Riparazioni", url: "/customer/repairs", icon: Wrench, group: "Le mie riparazioni" },
    { title: "Le Mie Garanzie", url: "/customer/warranties", icon: Shield, group: "Le mie riparazioni" },
    { title: "Richieste Remote", url: "/customer/remote-requests", icon: Send, group: "Le mie riparazioni" },
    { title: "Catalogo Servizi", url: "/customer/service-catalog", icon: Wrench, group: "Le mie riparazioni" },
    { title: "I Miei Ordini", url: "/customer/service-orders", icon: ClipboardList, group: "Le mie riparazioni" },
    { title: "Ordini", url: "/customer/orders", icon: ShoppingCart, group: "Acquisti" },
    { title: "Resi", url: "/customer/sales-returns", icon: RotateCcw, group: "Acquisti" },
    { title: "Profilo", url: "/customer/profile", icon: UserCircle, group: "Account" },
  ],
};

const integratedSuppliersConfig = [
  {
    key: "sifar",
    label: "SIFAR",
    routes: [
      { title: "Catalogo", path: "/catalog", icon: Package },
      { title: "Carrello", path: "/cart", icon: ShoppingCart },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "foneday",
    label: "Foneday EU",
    routes: [
      { title: "Catalogo", path: "/catalog", icon: Package },
      { title: "Carrello", path: "/cart", icon: ShoppingCart },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "mobilesentrix",
    label: "MobileSentrix",
    routes: [
      { title: "Catalogo", path: "/catalog", icon: Package },
      { title: "Carrello", path: "/cart", icon: ShoppingCart },
      { title: "I Miei Ordini", path: "/orders", icon: ClipboardList },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
  {
    key: "trovausati",
    label: "TrovaUsati",
    routes: [
      { title: "Marketplace B2B", path: "/marketplace", icon: ShoppingCart },
      { title: "Valutatore", path: "/valutatore", icon: Tag },
      { title: "Configurazione", path: "/settings", icon: Settings },
    ],
  },
];

const getIntegratedSuppliers = (rolePrefix: string) => 
  integratedSuppliersConfig.map(s => ({ ...s, basePath: `/${rolePrefix}/${s.key}` }));

const groupIcons: Record<string, typeof LayoutDashboard> = {
  "Dashboard": LayoutDashboard,
  "Clienti & Rivenditori": Users,
  "Clienti & Team": Users,
  "Centri & Riparazioni": Wrench,
  "Magazzino & Fornitori": Package,
  "Magazzino": Package,
  "Fornitori": Truck,
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
  "Gestione": Settings,
  "Gestione HR": Briefcase,
  "Acquisti": ShoppingCart,
  "Marketplace": Store,
  "Interscambio": ArrowRightLeft,
};

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});
  const { canAccessModule, hasFullAccess } = useStaffPermissions();

  const isReseller = user?.role === "reseller";
  const isResellerStaff = user?.role === "reseller_staff";
  const isRepairCenter = user?.role === "repair_center";
  const isFranchisingOrGdo = user?.resellerCategory === "franchising" || user?.resellerCategory === "gdo";
  const hasParentReseller = !!(user as any)?.parentResellerId;
  // Repair centers and reseller staff should also see their reseller's logo
  const shouldShowResellerLogo = hasParentReseller || isResellerStaff || isRepairCenter;

  // Query parent reseller info for sub-resellers, staff, and repair centers (to show their logo)
  const { data: parentReseller } = useQuery<{ id: string; fullName: string; logoUrl: string | null; ragioneSociale: string | null }>({
    queryKey: ["/api/my-parent-reseller"],
    enabled: shouldShowResellerLogo,
  });

  // Query sub-resellers for franchising/gdo resellers
  const { data: subResellers = [] } = useQuery<any[]>({
    queryKey: ["/api/reseller/sub-resellers"],
    enabled: isReseller && isFranchisingOrGdo,
  });

  const hasSubResellers = subResellers.length > 0;

  // Query current context (acting as sub-reseller or repair center)
  const { data: contextData } = useQuery<ContextResponse>({
    queryKey: ['/api/reseller/context'],
    enabled: isReseller || isResellerStaff,
  });
  const actingAs = contextData?.actingAs;

  // Query pending incoming transfer requests count for badge (reseller/reseller_staff)
  const { data: transferRequestsSummary } = useQuery<{ pendingCount: number }>({
    queryKey: ["/api/reseller/incoming-transfer-requests/summary"],
    enabled: user?.role === "reseller" || user?.role === "reseller_staff",
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const pendingTransferRequestsCount = transferRequestsSummary?.pendingCount || 0;

  // Query pending remote repair requests count for badge (reseller/reseller_staff)
  const { data: remoteRequestsSummary } = useQuery<{ count: number }>({
    queryKey: ["/api/reseller/remote-requests/pending-count"],
    enabled: user?.role === "reseller" || user?.role === "reseller_staff",
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const pendingRemoteRequestsCount = remoteRequestsSummary?.count || 0;

  // Query pending remote repair requests count for badge (repair_center)
  const { data: rcRemoteRequestsSummary } = useQuery<{ count: number }>({
    queryKey: ["/api/repair-center/remote-requests/pending-count"],
    enabled: user?.role === "repair_center",
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const rcPendingRemoteRequestsCount = rcRemoteRequestsSummary?.count || 0;

  // Query pending service orders count for badge (reseller/reseller_staff)
  const { data: serviceOrdersSummary } = useQuery<{ count: number }>({
    queryKey: ["/api/reseller/service-orders/pending-count"],
    enabled: user?.role === "reseller" || user?.role === "reseller_staff",
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const pendingServiceOrdersCount = serviceOrdersSummary?.count || 0;

  // Query pending customer tickets count for badge (reseller/reseller_staff)
  const { data: ticketsSummary } = useQuery<{ count: number }>({
    queryKey: ["/api/reseller/tickets/pending-count"],
    enabled: user?.role === "reseller" || user?.role === "reseller_staff",
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const pendingTicketsCount = ticketsSummary?.count || 0;

  // Query configured integrations (only those with reseller credentials)
  const { data: configuredIntegrationCodes = [] } = useQuery<string[]>({
    queryKey: ["/api/reseller/configured-integrations"],
    enabled: isReseller || isResellerStaff,
  });
  
  // Query configured integrations for repair center (uses parent reseller's credentials)
  const { data: rcConfiguredIntegrationCodes = [] } = useQuery<string[]>({
    queryKey: ["/api/repair-center/configured-integrations"],
    enabled: isRepairCenter,
  });
  
  // Get integrated suppliers with correct base path based on role
  const rolePrefix = isRepairCenter ? "repair-center" : "reseller";
  const activeIntegrationCodes = isRepairCenter ? rcConfiguredIntegrationCodes : configuredIntegrationCodes;
  const integratedSuppliers = getIntegratedSuppliers(rolePrefix);
  
  // Filter integrated suppliers based on configured integrations
  const filteredIntegratedSuppliers = integratedSuppliers.filter(
    supplier => activeIntegrationCodes.includes(supplier.key)
  );

  // Build menu items dynamically based on sub-resellers, permissions, and context
  const items = useMemo(() => {
    let baseItems: typeof menuItems.admin = [];
    
    // Check if reseller is acting as a different entity
    if ((isReseller || isResellerStaff) && actingAs) {
      if (actingAs.type === 'repair_center') {
        // When acting as a repair center, show repair center menu items
        baseItems = [...menuItems.repair_center];
      } else if (actingAs.type === 'reseller') {
        // When acting as a sub-reseller, show reseller items but without sub-reseller management
        baseItems = [...menuItems.reseller];
        // Sub-resellers cannot manage other sub-resellers (only main reseller can)
        baseItems = baseItems.filter(item => item.url !== "/reseller/sub-resellers");
      }
    } else {
      // Normal mode: use role-based menu items
      if (user?.role === "reseller_staff") {
        baseItems = [...menuItems.reseller];
      } else if (user) {
        baseItems = menuItems[user.role as keyof typeof menuItems] || [];
      }
    }
    
    // For reseller_staff, filter items based on permissions (only when not acting as another entity)
    if (isResellerStaff && !hasFullAccess && !actingAs) {
      baseItems = baseItems.filter(item => {
        // Dashboard is always accessible
        if (item.url === "/reseller") return true;
        // Guide is always accessible
        if (item.url === "/reseller/guide") return true;
        
        // Check if the item requires a specific module permission
        const requiredModule = getRequiredModuleForUrl(item.url);
        if (requiredModule) {
          return canAccessModule(requiredModule);
        }
        
        // Default: show item (for items not mapped to modules)
        return true;
      });
      
      // Remove Team and Sub-Resellers for staff
      baseItems = baseItems.filter(item => 
        item.url !== "/reseller/team" && 
        item.url !== "/reseller/sub-resellers"
      );
    }
    
    // Add Sub-Reseller management item for franchising/gdo resellers (only when NOT acting as another entity)
    if (isReseller && isFranchisingOrGdo && !actingAs) {
      const dashboardIndex = baseItems.findIndex(item => item.url === "/reseller");
      if (dashboardIndex !== -1) {
        const subResellerItem = { 
          title: "Gestione Sub-Reseller", 
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
    
    // Add dynamic Shop Online link for customers with a reseller
    if (user?.role === "customer" && user?.resellerId) {
      const ordiniIndex = baseItems.findIndex(item => item.url === "/customer/orders");
      if (ordiniIndex !== -1) {
        const shopItem = { 
          title: "Shop Online", 
          url: `/shop/${user.resellerId}`, 
          icon: Store, 
          group: "Acquisti" 
        };
        // Insert Shop Online before "Ordini"
        return [
          ...baseItems.slice(0, ordiniIndex),
          shopItem,
          ...baseItems.slice(ordiniIndex),
        ];
      }
    }
    
    return baseItems;
  }, [user, isReseller, isResellerStaff, isFranchisingOrGdo, hasFullAccess, canAccessModule, actingAs]);
  
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
          return "Fornitori";
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
      <SidebarHeader className="px-3 py-4">
        {parentReseller?.logoUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 rounded-xl blur-sm" />
              <Avatar className="relative h-11 w-11 rounded-xl shadow-lg ring-2 ring-emerald-500/30">
                <AvatarImage src={parentReseller.logoUrl} alt={parentReseller.ragioneSociale || parentReseller.fullName} className="object-contain" />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-bold">
                  {getInitials(parentReseller.ragioneSociale || parentReseller.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm block truncate">
                {parentReseller.ragioneSociale || parentReseller.fullName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-teal-500/20 rounded-xl blur-sm" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg ring-2 ring-emerald-500/30">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">MonkeyPlan</span>
                <span className="text-[10px] text-white font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm">Beta v.23.5</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
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
          
          // Dashboard and Sub-Reseller groups: render items directly without collapsible
          if (group === "Dashboard" || group === "Principale" || group === "Sub-Reseller") {
            return (
              <SidebarGroup key={group} className="px-3 py-2">
                <SidebarMenu>
                  {groupItems.map((item) => {
                    // Exact match for Dashboard items to prevent sub-routes from highlighting parent
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
                            <span className={`font-semibold ${isActive ? "text-white" : ""}`}>{item.title}</span>
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
                      {group}
                    </span>
                    {group === "Interscambio" && pendingTransferRequestsCount > 0 && !isOpen && (
                      <span 
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                        data-testid="badge-pending-transfer-requests-group"
                      >
                        {pendingTransferRequestsCount}
                      </span>
                    )}
                    {group === "Assistenza" && (pendingRemoteRequestsCount + pendingTicketsCount) > 0 && !isOpen && (
                      <span 
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                        data-testid="badge-pending-assistenza-group"
                      >
                        {pendingRemoteRequestsCount + pendingTicketsCount}
                      </span>
                    )}
                    {group === "Lavorazioni" && rcPendingRemoteRequestsCount > 0 && !isOpen && (
                      <span 
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                        data-testid="badge-pending-rc-remote-requests-group"
                      >
                        {rcPendingRemoteRequestsCount}
                      </span>
                    )}
                    {group === "Centri & Riparazioni" && pendingServiceOrdersCount > 0 && !isOpen && (
                      <span 
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                        data-testid="badge-pending-service-orders-group"
                      >
                        {pendingServiceOrdersCount}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="ml-7 mt-1.5 border-l border-sidebar-border/40 pl-0.5">
                      {groupItems.map((item) => {
                        const isActive = location === item.url || location.startsWith(item.url + "/");
                        const showTransferBadge = item.url === "/reseller/transfer-requests" && pendingTransferRequestsCount > 0;
                        const showRemoteBadge = item.url === "/reseller/remote-requests" && pendingRemoteRequestsCount > 0;
                        const showRcRemoteBadge = item.url === "/repair-center/remote-requests" && rcPendingRemoteRequestsCount > 0;
                        const showServiceOrdersBadge = item.url === "/reseller/service-orders" && pendingServiceOrdersCount > 0;
                        const showTicketsBadge = item.url === "/reseller/tickets" && pendingTicketsCount > 0;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild 
                              isActive={isActive} 
                              className={`pl-3 py-2 rounded-lg overflow-visible ${isActive ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground hover-elevate"}`}
                            >
                              <Link 
                                href={item.url} 
                                onClick={handleLinkClick}
                                data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                              >
                                <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
                                <span className="flex-1 text-[13px]">{item.title}</span>
                                {showTransferBadge && (
                                  <span 
                                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                                    data-testid="badge-pending-transfer-requests"
                                  >
                                    {pendingTransferRequestsCount}
                                  </span>
                                )}
                                {showRemoteBadge && (
                                  <span 
                                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                                    data-testid="badge-pending-remote-requests"
                                  >
                                    {pendingRemoteRequestsCount}
                                  </span>
                                )}
                                {showRcRemoteBadge && (
                                  <span 
                                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                                    data-testid="badge-pending-rc-remote-requests"
                                  >
                                    {rcPendingRemoteRequestsCount}
                                  </span>
                                )}
                                {showServiceOrdersBadge && (
                                  <span 
                                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5"
                                    data-testid="badge-pending-service-orders"
                                  >
                                    {pendingServiceOrdersCount}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                      
                      {group === "Fornitori" && ((isReseller || isResellerStaff) && canAccessModule("suppliers") || isRepairCenter) && filteredIntegratedSuppliers.length > 0 && (
                        <>
                          <div className="my-2 mx-2 border-t border-sidebar-border" />
                          <div className="px-4 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Fornitori Integrati
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

      <SidebarFooter className="px-3 py-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/10 backdrop-blur-sm">
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
