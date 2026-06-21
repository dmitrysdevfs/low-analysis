import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { RoleDetailView } from "@/features/roles-detail/components/RoleDetailView";
import { ROLE_DETAIL_CONFIGS } from "@/features/roles-detail/lib/roleDetailConfigs";

export const metadata: Metadata = {
  title: "Адміністратор · Law Analysis",
  description:
    "Роль адміністратора: повний контроль над платформою, ролями, аудитом, контентом і системними процесами.",
};

export default function RolesAdminPage() {
  return (
    <Layout>
      <RoleDetailView config={ROLE_DETAIL_CONFIGS.admin} />
    </Layout>
  );
}
