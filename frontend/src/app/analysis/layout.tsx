import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Аналізатор законодавства",
  description:
    "Аналітичний режим для огляду всього корпусу законів України та deep-dive по окремому закону.",
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
