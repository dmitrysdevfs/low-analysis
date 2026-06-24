import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Пошук законів",
  description:
    "Пошук за назвою, номером, датою та статусом нормативно-правових актів України.",
  openGraph: {
    title: "Пошук законів · Law Analysis",
    description:
      "Пошук за назвою, номером, датою та статусом нормативно-правових актів України.",
  },
  // canonical lives per-page: /search/page.tsx has it, /search/results does not
  // (results URLs are dynamic /?q=... and should not share one canonical)
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
