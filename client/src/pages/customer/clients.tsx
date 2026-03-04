import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { CustomerBranchManager } from "@/components/CustomerBranchManager";
import { Users } from "lucide-react";

export default function CustomerClientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">{t("customer.myClients")}</h1>
          <p className="text-sm text-muted-foreground">{t("customer.myClientsDesc")}</p>
        </div>
      </div>

      {user?.id && (
        <CustomerBranchManager
          customerId={user.id}
          customerName={user.fullName}
          mode="subclients"
        />
      )}
    </div>
  );
}
