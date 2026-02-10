import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface LicenseMyResponse {
  license: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  plan: {
    id: string;
    name: string;
    features: string[];
  } | null;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  enabledFeatures?: string[];
}

export function useLicenseStatus() {
  const { user } = useAuth();
  const isReseller = user?.role === "reseller" || user?.role === "reseller_staff";

  const { data, isLoading, isError } = useQuery<LicenseMyResponse>({
    queryKey: ["/api/licenses/my"],
    enabled: isReseller,
    refetchInterval: 5 * 60 * 1000,
  });

  const hasActiveLicense = !!data?.license && !data.isExpired && data.license.status === "active";
  const daysRemaining = data?.daysRemaining ?? null;
  const isExpiringSoon = data?.isExpiringSoon ?? false;
  const enabledFeatures = data?.enabledFeatures ?? [];
  const hasAllFeatures = hasActiveLicense && enabledFeatures.length === 0;

  function hasFeature(featureId: string): boolean {
    if (!hasActiveLicense) return false;
    if (hasAllFeatures) return true;
    return enabledFeatures.includes(featureId);
  }

  return {
    hasActiveLicense,
    license: data?.license ?? null,
    plan: data?.plan ?? null,
    daysRemaining,
    isExpiringSoon,
    isLoading: isLoading && !isError,
    isReseller,
    enabledFeatures,
    hasAllFeatures,
    hasFeature,
  };
}
