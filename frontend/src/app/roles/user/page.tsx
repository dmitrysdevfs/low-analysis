import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { RoleDetailView } from "@/features/roles-detail/components/RoleDetailView";
import { ROLE_DETAIL_CONFIGS } from "@/features/roles-detail/lib/roleDetailConfigs";

export const metadata: Metadata = {
  title: "Користувач · Law Analysis",
  description:
    "Можливості зареєстрованого користувача на платформі Law Analysis: пропозиції, голосування та персональний контекст.",
};

export default function RolesUserPage() {
  return (
    <Layout>
      <RoleDetailView config={ROLE_DETAIL_CONFIGS.user} />
    </Layout>
  );
}
