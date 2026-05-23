import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const backendUrl =
    process.env.API_PROXY_TARGET_URL || "https://low-analysis.onrender.com";

  try {
    const res = await fetch(`${backendUrl}/api/subjects/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const subject: { canonical_name: string } = await res.json();
      const name = subject.canonical_name;
      return {
        title: name,
        description: `Суб'єкт «${name}» — пов'язані норми та статті законодавства України.`,
        openGraph: {
          title: `${name} · Law Analysis`,
          description: `Суб'єкт «${name}» — пов'язані норми та статті законодавства України.`,
        },
        alternates: { canonical: `/subjects/${id}` },
      };
    }
  } catch {
    // fallback below
  }

  return {
    title: "Суб'єкт регулювання",
    alternates: { canonical: `/subjects/${id}` },
  };
}

export default function SubjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
