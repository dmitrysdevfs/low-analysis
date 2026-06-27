import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { RoleDetailView } from "@/features/roles-detail/components/RoleDetailView";
import { ROLE_DETAIL_CONFIGS } from "@/features/roles-detail/lib/roleDetailConfigs";

export const metadata: Metadata = {
  title: "Супервайзер · Law Analysis",
  description:
    "Роль супервізера: групи, моніторинг активності студентів та перевірка fork/diff.",
};

export default function RolesSupervisorPage() {
  return (
    <Layout>
      <RoleDetailView config={ROLE_DETAIL_CONFIGS.supervisor} />
    </Layout>
  );
}
