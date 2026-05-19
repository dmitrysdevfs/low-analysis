import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const backendUrl =
    process.env.API_PROXY_TARGET_URL || "https://low-analysis.onrender.com";

  try {
    const res = await fetch(`${backendUrl}/api/laws`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const laws: Array<{
        _id: string;
        title: string;
        code: string;
        totalSections: number;
        totalArticles: number;
      }> = await res.json();
      const law = laws.find((l) => l._id === id);
      if (law) {
        const description = `${law.code} — структура закону: ${law.totalSections} розд., ${law.totalArticles} статей.`;
        return {
          title: law.title,
          description,
          openGraph: {
            title: `${law.title} · Law Analysis`,
            description,
          },
          alternates: { canonical: `/laws/${id}` },
        };
      }
    }
  } catch {
    // fallback below
  }

  return {
    title: "Закон",
    alternates: { canonical: `/laws/${id}` },
  };
}

export default function LawDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
