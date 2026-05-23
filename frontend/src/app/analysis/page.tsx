"use client";

import { Layout } from "@/components/layout/Layout";
import { GlobalAnalysisView } from "@/features/analysis/views/GlobalAnalysisView";

export default function AnalysisPage() {
  return (
    <Layout>
      <GlobalAnalysisView />
    </Layout>
  );
}
