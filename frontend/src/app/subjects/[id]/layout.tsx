import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const name = decodeURIComponent(id);

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

export default function SubjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
