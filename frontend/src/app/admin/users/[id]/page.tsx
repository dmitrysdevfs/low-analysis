import { AdminUserProfileView } from "@/components/admin/AdminUserProfileView";

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserProfileView userId={id} />;
}
