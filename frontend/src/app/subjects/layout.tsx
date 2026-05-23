import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Суб'єкти регулювання",
  description:
    "Фізичні та юридичні особи, права та обов'язки яких регулюються законодавством України. Пошук суб'єктів та пов'язаних норм.",
  openGraph: {
    title: "Суб'єкти регулювання · Law Analysis",
    description:
      "Фізичні та юридичні особи, права та обов'язки яких регулюються законодавством України.",
  },
  alternates: {
    canonical: "/subjects",
  },
};

export default function SubjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
