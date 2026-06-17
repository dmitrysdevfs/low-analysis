import type { Metadata } from "next";
import { Layout } from "@/components/layout/Layout";
import { ManagedPageView } from "@/features/page-builder/components/ManagedPageView";
import { SUPPORT_FALLBACK } from "@/features/page-builder/lib/roleFallbacks";

export const metadata: Metadata = {
  title: "Підтримати проєкт · Law Analysis",
  description: "Підтримайте розвиток платформи Law Analysis через Patreon.",
};

export default function SupportPage() {
  return (
    <Layout>
      <ManagedPageView
        slug="support"
        fallback={SUPPORT_FALLBACK}
        eyebrow="Підтримка проєкту"
      />
    </Layout>
  );
}
