import type { Metadata } from "next";

type Props = { params: Promise<{ id: string; num: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, num } = await params;
  const backendUrl =
    process.env.API_PROXY_TARGET_URL || "https://low-analysis.onrender.com";

  try {
    const res = await fetch(`${backendUrl}/api/laws`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const laws: Array<{ _id: string; title: string; code: string }> =
        await res.json();
      const law = laws.find((l) => l._id === id);
      if (law) {
        return {
          title: `Стаття ${num} — ${law.title}`,
          description: `Стаття ${num} закону «${law.title}» (${law.code}).`,
          openGraph: {
            title: `Стаття ${num} · ${law.title} · Law Analysis`,
          },
          alternates: { canonical: `/laws/${id}/articles/${num}` },
        };
      }
    }
  } catch {
    // fallback below
  }

  return {
    title: `Стаття ${num}`,
    alternates: { canonical: `/laws/${id}/articles/${num}` },
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
