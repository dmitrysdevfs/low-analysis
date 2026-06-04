import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AssistantPageView = dynamic(
  () =>
    import("@/features/assistant").then((m) => ({
      default: m.AssistantPageView,
    })),
  { ssr: false },
);

export const metadata: Metadata = {
  title: "Lex — AI Помічник | Law Analysis",
  description:
    "Задавайте запитання про закони України та отримуйте відповіді від AI-помічника Lex.",
};

export default function AssistantPage() {
  return <AssistantPageView />;
}
