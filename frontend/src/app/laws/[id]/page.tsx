import type { Metadata } from "next";
import { LawTreePageClient } from "./LawTreePageClient";

const API_BASE =
  process.env.API_PROXY_TARGET_URL || "https://low-analysis.onrender.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/laws/${id}/tree`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data: { law?: { title?: string } } = await res.json();
      const title = data.law?.title ?? "Закон";
      return {
        title: `${title} | Law Analysis`,
        description: `Структура, статті та аналіз закону "${title}".`,
      };
    }
  } catch {}
  return { title: "Закон | Law Analysis" };
}

export default function LawTreePage() {
  return <LawTreePageClient />;
}
