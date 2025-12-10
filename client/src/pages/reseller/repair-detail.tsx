import RepairDetailPage from "@/pages/shared/repair-detail";

export default function ResellerRepairDetail() {
  return (
    <RepairDetailPage
      routePattern="/reseller/repairs/:id"
      backPath="/reseller/repairs"
    />
  );
}
