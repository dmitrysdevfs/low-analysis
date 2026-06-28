import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { RolesDashboardView } from "@/features/roles-dashboard/components/RolesDashboardView";

export const metadata: Metadata = {
  title: "Ролі Платформи · Law Analysis",
  description:
    "Огляд ролей Law Analysis: гість, користувач, законотворець, супервізер та адміністратор.",
};

export default function RolesDashboardPage() {
  return (
    <Layout>
      <RolesDashboardView />
    </Layout>
  );
}
