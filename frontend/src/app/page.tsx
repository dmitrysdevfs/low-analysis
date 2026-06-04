import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "Law Analysis — Правова екосистема України",
  description:
    "Структурований пошук, аналіз та робота із законодавством України. AI-помічник, кабінет законотворця та відкрита аналітика.",
};

export default function HomePage() {
  return <HomeClient />;
}
