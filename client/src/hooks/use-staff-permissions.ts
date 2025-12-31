import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export type StaffModule = 
  | "repairs"
  | "customers"
  | "products"
  | "inventory"
  | "repair_centers"
  | "services"
  | "suppliers"
  | "supplier_orders"
  | "appointments"
  | "invoices"
  | "tickets";

export interface StaffPermission {
  module: StaffModule;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface PermissionsResponse {
  role: string;
  permissions?: StaffPermission[];
  fullAccess?: boolean;
}

export function useStaffPermissions() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<PermissionsResponse>({
    queryKey: ["/api/my-permissions"],
    enabled: !!user,
  });

  const hasFullAccess = data?.fullAccess === true || user?.role === "reseller" || user?.role === "admin";

  const hasModuleAccess = (module: StaffModule, action: "read" | "create" | "update" | "delete" = "read"): boolean => {
    if (hasFullAccess) return true;
    if (!data?.permissions) return false;

    const permission = data.permissions.find(p => p.module === module);
    if (!permission) return false;

    switch (action) {
      case "read": return permission.canRead;
      case "create": return permission.canCreate;
      case "update": return permission.canUpdate;
      case "delete": return permission.canDelete;
      default: return false;
    }
  };

  const canAccessModule = (module: StaffModule): boolean => {
    return hasModuleAccess(module, "read");
  };

  return {
    permissions: data?.permissions || [],
    hasFullAccess,
    hasModuleAccess,
    canAccessModule,
    isLoading,
  };
}

export const moduleToMenuMapping: Record<StaffModule, string[]> = {
  repairs: [
    "/reseller/repairs",
    "/reseller/new-repair",
    "/reseller/diagnostics",
    "/reseller/quotes",
  ],
  customers: [
    "/reseller/customers",
  ],
  products: [
    "/reseller/products",
    "/reseller/dispositivi",
    "/reseller/accessory-catalog",
    "/reseller/device-catalog",
    "/reseller/shop-catalog",
  ],
  inventory: [
    "/reseller/warehouses",
    "/reseller/network-warehouses",
    "/reseller/transfer-requests",
    "/reseller/incoming-transfer-requests",
    "/reseller/sub-transfer-requests",
  ],
  repair_centers: [
    "/reseller/repair-centers",
    "/reseller/repair-center-schedules",
  ],
  services: [
    "/reseller/service-catalog",
    "/reseller/utility",
    "/reseller/utility/suppliers",
    "/reseller/utility/services",
    "/reseller/utility/practices",
    "/reseller/utility/commissions",
    "/reseller/utility/reports",
  ],
  suppliers: [
    "/reseller/suppliers",
    "/reseller/sifar/settings",
    "/reseller/sifar/catalog",
    "/reseller/sifar/cart",
    "/reseller/foneday/settings",
    "/reseller/foneday/catalog",
    "/reseller/foneday/cart",
    "/reseller/mobilesentrix/settings",
    "/reseller/mobilesentrix/catalog",
    "/reseller/trovausati/settings",
  ],
  supplier_orders: [
    "/reseller/supplier-orders",
    "/reseller/supplier-returns",
    "/reseller/b2b-catalog",
    "/reseller/b2b-orders",
    "/reseller/b2b-returns",
    "/reseller/rc-b2b-orders",
    "/reseller/marketplace",
    "/reseller/marketplace-orders",
    "/reseller/marketplace-sales",
  ],
  appointments: [
    "/reseller/appointments",
  ],
  invoices: [
    "/reseller/invoices",
    "/reseller/reports",
    "/reseller/sales-orders",
    "/reseller/shipments",
    "/reseller/payments",
    "/reseller/sales-returns",
  ],
  tickets: [
    "/reseller/tickets",
    "/reseller/guide",
  ],
};

export function getRequiredModuleForUrl(url: string): StaffModule | null {
  for (const [module, urls] of Object.entries(moduleToMenuMapping)) {
    if (urls.some(u => url === u || url.startsWith(u + "/"))) {
      return module as StaffModule;
    }
  }
  return null;
}
