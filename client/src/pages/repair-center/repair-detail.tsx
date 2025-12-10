import RepairDetailPage from "@/pages/shared/repair-detail";

export default function RepairCenterRepairDetail() {
  return (
    <RepairDetailPage
      routePattern="/repair-center/repairs/:id"
      backPath="/repair-center/repairs"
    />
  );
}
