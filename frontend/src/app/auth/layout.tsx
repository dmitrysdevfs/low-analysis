import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вхід / Реєстрація",
  description: "Вхід або реєстрація в системі Law Analysis.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
