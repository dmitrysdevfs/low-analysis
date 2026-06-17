import dynamic from "next/dynamic";
import { AccessRequestsPanel } from "@/features/admin/AccessRequestsPanel";

const AdminDashboardView = dynamic(() =>
  import("@/components/admin/AdminDashboardView").then((m) => ({
    default: m.AdminDashboardView,
  })),
);

export default function AdminPage() {
  return (
    <>
      <AdminDashboardView />
      <AccessRequestsPanel />
    </>
  );
}
