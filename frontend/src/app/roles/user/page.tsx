import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { ROLES_USER_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Користувач · Law Analysis",
  description: "Можливості зареєстрованого користувача на платформі Law Analysis.",
};

export default function RolesUserPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="roles-user"
        fallback={ROLES_USER_FALLBACK}
        eyebrow="Ролі платформи"
      />
    </Layout>
  );
}
