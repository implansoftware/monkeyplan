import RepairDetailPage from "@/pages/shared/repair-detail";
import { useTranslation } from "react-i18next";

export default function ResellerRepairDetail() {
  const { t } = useTranslation();
  return (
    <RepairDetailPage
      routePattern="/reseller/repairs/:id"
      backPath="/reseller/repairs"
    />
  );
}
