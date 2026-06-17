import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { ROLES_ADMIN_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Адміністратор · Law Analysis",
  description:
    "Роль Адміністратора: повний контроль над системою та модерацією.",
};

export default function RolesAdminPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="roles-admin"
        fallback={ROLES_ADMIN_FALLBACK}
        eyebrow="Ролі платформи"
      />
    </Layout>
  );
}
