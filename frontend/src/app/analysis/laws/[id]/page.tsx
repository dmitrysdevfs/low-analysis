"use client";

import { useParams } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { LawAnalysisView } from "@/features/analysis/views/LawAnalysisView";

export default function AnalysisLawPage() {
  const params = useParams<{ id: string }>();

  return (
    <Layout>
      <LawAnalysisView lawId={params.id} />
    </Layout>
  );
}
