import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { DOCS_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Документація · Law Analysis",
  description: "Технічна документація для розробників платформи Law Analysis.",
};

export default function DocsPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="docs"
        fallback={DOCS_FALLBACK}
        eyebrow="Developer Docs"
      />
    </Layout>
  );
}
