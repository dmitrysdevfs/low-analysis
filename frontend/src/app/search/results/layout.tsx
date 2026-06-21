import type { Metadata } from "next";

// Search result pages are dynamic (?q=...) — exclude from indexing
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
