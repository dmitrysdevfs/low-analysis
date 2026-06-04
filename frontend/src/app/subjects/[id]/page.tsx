import type { Metadata } from "next";
import { SubjectPageClient } from "./SubjectPageClient";

export const metadata: Metadata = {
  title: "Суб'єкт | Law Analysis",
  description: "Аналіз ролей та згадок суб'єкта в законодавстві України.",
};

export default function SubjectPage() {
  return <SubjectPageClient />;
}
