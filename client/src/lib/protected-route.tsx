import { useAuth } from "@/hooks/use-auth";
import { useStaffPermissions, getRequiredModuleForUrl } from "@/hooks/use-staff-permissions";
import { PermissionGuard } from "@/components/permission-guard";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === "admin" ? "/" :
      user.role === "reseller" ? "/reseller" :
      user.role === "reseller_staff" ? "/reseller" :
      user.role === "repair_center" ? "/repair-center" :
      "/customer";
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <ProtectedRouteContent Component={Component} path={path} />
    </Route>
  );
}

function ProtectedRouteContent({ Component, path }: { Component: () => React.JSX.Element; path: string }) {
  const { user } = useAuth();
  const { hasFullAccess, canAccessModule, isLoading: permissionsLoading } = useStaffPermissions();

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role === "reseller_staff" && !hasFullAccess) {
    const requiredModule = getRequiredModuleForUrl(path);
    if (requiredModule && !canAccessModule(requiredModule)) {
      return <PermissionGuard module={requiredModule}>{null}</PermissionGuard>;
    }
  }

  return <Component />;
}
