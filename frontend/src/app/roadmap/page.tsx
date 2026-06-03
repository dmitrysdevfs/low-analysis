import { RoadmapPublicView } from "@/features/roadmap";

export const metadata = {
  title: "Відкритий Roadmap",
  description:
    "Що вже є, що зараз будується і куди рухається платформа Law Analysis. Фази розробки, архітектурні рішення та плани.",
};

export default function RoadmapPage() {
  return <RoadmapPublicView />;
}
