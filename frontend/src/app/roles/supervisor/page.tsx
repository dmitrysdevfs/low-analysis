import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { ROLES_SUPERVISOR_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Супервайзер · Law Analysis",
  description:
    "Роль Супервайзера: моніторинг груп студентів та порівняння форків.",
};

export default function RolesSupervisorPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="roles-supervisor"
        fallback={ROLES_SUPERVISOR_FALLBACK}
        eyebrow="Ролі платформи"
      />
    </Layout>
  );
}
