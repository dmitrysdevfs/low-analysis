import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { ROLES_GUEST_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Гість · Law Analysis",
  description: "Що доступно без реєстрації на платформі Law Analysis.",
};

export default function RolesGuestPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="roles-guest"
        fallback={ROLES_GUEST_FALLBACK}
        eyebrow="Ролі платформи"
      />
    </Layout>
  );
}
