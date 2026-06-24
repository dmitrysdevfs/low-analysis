import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { RoleDetailView } from "@/features/roles-detail/components/RoleDetailView";
import { ROLE_DETAIL_CONFIGS } from "@/features/roles-detail/lib/roleDetailConfigs";

export const metadata: Metadata = {
  title: "Законотворець · Law Analysis",
  description:
    "Роль законотворця: форки, поправки, diff і підготовка альтернативних редакцій законів.",
};

export default function RolesLawmakerPage() {
  return (
    <Layout>
      <RoleDetailView config={ROLE_DETAIL_CONFIGS.lawmaker} />
    </Layout>
  );
}
