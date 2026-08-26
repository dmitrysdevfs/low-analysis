import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { TeamPageView } from "@/components/team/TeamPageView";

export const metadata: Metadata = {
  title: "Команда проєкту",
  description:
    "Команда Law Analysis: продукт, дизайн, інженерія, якість та юридична експертиза — люди, які створюють реєстр суб'єктів і норм законодавства України.",
};

export default function TeamPage() {
  return (
    <Layout>
      <TeamPageView />
    </Layout>
  );
}
