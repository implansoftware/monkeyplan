import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "customer" | "reseller" | "repair_center";
  isActive: boolean;
  repairCenterId: string | null;
  resellerId: string | null;
};

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  return { user, isLoading, error };
}
