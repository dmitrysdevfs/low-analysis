import type { Metadata } from "next";
import AssistantClientWrapper from "./AssistantClientWrapper";

export const metadata: Metadata = {
  title: "Lex — AI Помічник | Law Analysis",
  description:
    "Задавайте запитання про закони України та отримуйте відповіді від AI-помічника Lex.",
};

export default function AssistantPage() {
  return <AssistantClientWrapper />;
}
