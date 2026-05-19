import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Закони України",
  description:
    "Перелік законів України у структурованому форматі. Перегляд розділів, статей та абзаців кожного нормативного акту.",
  openGraph: {
    title: "Закони України · Law Analysis",
    description: "Перелік законів України у структурованому форматі.",
  },
  alternates: {
    canonical: "/laws",
  },
};

export default function LawsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
