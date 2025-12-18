import RepairDetailPage from "@/pages/shared/repair-detail";

export default function CustomerRepairDetail() {
  return (
    <RepairDetailPage
      routePattern="/customer/repairs/:id"
      backPath="/customer/repairs"
    />
  );
}
