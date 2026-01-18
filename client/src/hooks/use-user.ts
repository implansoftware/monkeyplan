import { useQuery } from "@tanstack/react-query";

type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "customer" | "reseller" | "sub_reseller" | "repair_center" | "reseller_staff" | "reseller_collaborator" | "admin_staff" | "repair_center_staff";
  isActive: boolean;
  repairCenterId: string | null;
  resellerId: string | null;
  ragioneSociale: string | null;
  partitaIva: string | null;
  codiceFiscale: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  iban: string | null;
  codiceUnivoco: string | null;
  pec: string | null;
};

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  return { user, isLoading, error };
}
