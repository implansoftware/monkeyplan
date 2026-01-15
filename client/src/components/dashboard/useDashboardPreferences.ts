import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardLayoutConfig, mergeLayoutWithDefaults } from "./widget-registry";

interface DashboardPreference {
  id: string;
  userId: string;
  role: string;
  layout: DashboardLayoutConfig;
  createdAt: string;
  updatedAt: string;
}

export function useDashboardPreferences(role: "reseller" | "repair_center") {
  const { data: savedPreferences, isLoading } = useQuery<DashboardPreference | null>({
    queryKey: ["/api/dashboard-preferences"],
    staleTime: 1000 * 60 * 5,
  });

  const layout = mergeLayoutWithDefaults(savedPreferences?.layout || null, role);

  const saveMutation = useMutation({
    mutationFn: async (newLayout: DashboardLayoutConfig) => {
      const response = await apiRequest("PUT", "/api/dashboard-preferences", { layout: newLayout });
      return response.json();
    },
    onSuccess: (data: DashboardPreference) => {
      queryClient.setQueryData(["/api/dashboard-preferences"], data);
    },
  });

  return {
    layout,
    isLoading,
    isSaving: saveMutation.isPending,
    saveLayout: saveMutation.mutate,
    saveLayoutAsync: saveMutation.mutateAsync,
  };
}
