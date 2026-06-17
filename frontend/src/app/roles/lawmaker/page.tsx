import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { ROLES_LAWMAKER_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Законотворець · Law Analysis",
  description: "Роль Законотворця: форки, поправки та подання законопроєктів.",
};

export default function RolesLawmakerPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="roles-lawmaker"
        fallback={ROLES_LAWMAKER_FALLBACK}
        eyebrow="Ролі платформи"
      />
    </Layout>
  );
}
