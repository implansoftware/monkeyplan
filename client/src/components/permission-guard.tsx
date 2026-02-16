import { useStaffPermissions, StaffModule, getRequiredModuleForUrl } from "@/hooks/use-staff-permissions";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PermissionGuardProps {
  children: React.ReactNode;
  module?: StaffModule;
  action?: "read" | "create" | "update" | "delete";
  fallback?: React.ReactNode;
  silent?: boolean;
}

export function PermissionGuard({
  children,
  module,
  action = "read",
  fallback,
  silent = false,
}: PermissionGuardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasModuleAccess, hasFullAccess, isLoading } = useStaffPermissions();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (hasFullAccess) {
    return <>{children}</>;
  }

  if (user.role !== "reseller_staff") {
    return <>{children}</>;
  }

  const requiredModule = module || getRequiredModuleForUrl(location);

  if (!requiredModule) {
    return <>{children}</>;
  }

  const hasAccess = hasModuleAccess(requiredModule, action);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (silent) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{t("permissions.accessDenied")}</CardTitle>
          <CardDescription>
            {t("permissions.accessDeniedDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                {t("permissions.contactAdmin")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/reseller")}
            data-testid="button-back-to-dashboard"
          >
            {t("permissions.backToDashboard")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ActionGuardProps {
  children: React.ReactNode;
  module: StaffModule;
  action: "create" | "update" | "delete";
  fallback?: React.ReactNode;
}

export function ActionGuard({
  children,
  module,
  action,
  fallback,
}: ActionGuardProps) {
  const { user } = useAuth();
  const { hasModuleAccess, hasFullAccess, isLoading } = useStaffPermissions();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (hasFullAccess) {
    return <>{children}</>;
  }

  if (user.role !== "reseller_staff") {
    return <>{children}</>;
  }

  const hasAccess = hasModuleAccess(module, action);

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

export function useCanPerformAction(module: StaffModule, action: "read" | "create" | "update" | "delete"): boolean {
  const { user } = useAuth();
  const { hasModuleAccess, hasFullAccess } = useStaffPermissions();

  if (!user) return false;
  if (hasFullAccess) return true;
  if (user.role !== "reseller_staff") return true;

  return hasModuleAccess(module, action);
}
