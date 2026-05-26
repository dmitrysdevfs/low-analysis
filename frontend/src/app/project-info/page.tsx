import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ProjectInfoPageView } from "@/features/page-builder/components/ProjectInfoPageView";

export const metadata: Metadata = {
  title: "Інформація про проєкт",
  description:
    "Керована сторінка з описом проєкту Low Analysis, його модулів та можливостей.",
};

export default function ProjectInfoPage() {
  return (
    <Layout>
      <ProjectInfoPageView />
    </Layout>
  );
}
