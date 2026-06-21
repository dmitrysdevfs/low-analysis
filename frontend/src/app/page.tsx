import type { Metadata } from "next";
import { HomePageOneClient } from "./home-page-1/HomePageOneClient";

export const metadata: Metadata = {
  title: "Law Analysis — Аналіз законодавства України",
  description:
    "Структурований пошук, аналіз та робота із законодавством України. AI-помічник, кабінет законотворця та відкрита аналітика.",
};

export default function HomePage() {
  return <HomePageOneClient />;
}
