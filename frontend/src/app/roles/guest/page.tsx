import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { RoleDetailView } from "@/features/roles-detail/components/RoleDetailView";
import { ROLE_DETAIL_CONFIGS } from "@/features/roles-detail/lib/roleDetailConfigs";

export const metadata: Metadata = {
  title: "Гість · Law Analysis",
  description:
    "Що доступно без реєстрації на платформі Law Analysis: закони, пошук і відкрита аналітика.",
};

export default function RolesGuestPage() {
  return (
    <Layout>
      <RoleDetailView config={ROLE_DETAIL_CONFIGS.guest} />
    </Layout>
  );
}
