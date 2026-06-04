import type { Metadata } from "next";
import { ArticlePageClient } from "./ArticlePageClient";

const API_BASE =
  process.env.API_PROXY_TARGET_URL || "https://low-analysis.onrender.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; num: string }>;
}): Promise<Metadata> {
  const { id, num } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/laws/${id}/articles/${num}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data: {
        law?: { title?: string };
        article?: { title?: string };
      } = await res.json();
      const lawTitle = data.law?.title ?? "Закон";
      const articleTitle = data.article?.title ?? `Стаття ${num}`;
      return {
        title: `${articleTitle} — ${lawTitle} | Law Analysis`,
        description: `Стаття ${num} закону "${lawTitle}". Текст, суб'єкти та пов'язані зміни.`,
      };
    }
  } catch {}
  return { title: `Стаття ${num} | Law Analysis` };
}

export default function ArticlePage() {
  return <ArticlePageClient />;
}
