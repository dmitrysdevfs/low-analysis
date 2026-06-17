import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { AccessRequestsPanel } from "@/features/admin/AccessRequestsPanel";

export default function AdminPage() {
  return (
    <>
      <AdminDashboardView />
      <AccessRequestsPanel />
    </>
  );
}
