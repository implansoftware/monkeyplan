import RepairDetailPage from "@/pages/shared/repair-detail";

export default function AdminRepairDetail() {
  return (
    <RepairDetailPage
      routePattern="/admin/repairs/:id"
      backPath="/admin/repairs"
    />
  );
}
