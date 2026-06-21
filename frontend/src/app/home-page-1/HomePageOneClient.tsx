"use client";

import dynamic from "next/dynamic";
import { Layout } from "@/components/layout/Layout";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { HeroSection } from "@/components/home/HeroSection";

const placeholder = (h = 320) => {
  function PlaceholderLoader() { return <div style={{ minHeight: h }} />; }
  return PlaceholderLoader;
};

const PlatformStructureSection = dynamic(
  () => import("@/components/home/premium/PlatformStructureSection").then((m) => ({ default: m.PlatformStructureSection })),
  { ssr: false, loading: placeholder(480) }
);

const PlatformBenefitsSection = dynamic(
  () => import("@/components/home/premium/PlatformBenefitsSection").then((m) => ({ default: m.PlatformBenefitsSection })),
  { ssr: false, loading: placeholder(360) }
);

const RightsMarquee = dynamic(
  () => import("@/components/home/RightsMarquee").then((m) => ({ default: m.RightsMarquee })),
  { ssr: false, loading: placeholder(80) }
);

const PremiumRoadmapSection = dynamic(
  () => import("@/components/home/premium/RoadmapSection").then((m) => ({ default: m.PremiumRoadmapSection })),
  { ssr: false, loading: placeholder(480) }
);

const LandingCTASection = dynamic(
  () => import("@/components/home/premium/LandingCTASection").then((m) => ({ default: m.LandingCTASection })),
  { ssr: false, loading: placeholder(240) }
);

const PlatformStatsBar = dynamic(
  () => import("@/components/stats/PlatformStatsBar").then((m) => ({ default: m.PlatformStatsBar })),
  { ssr: false, loading: placeholder(80) }
);

export function HomePageOneClient() {
  const w = useWindowWidth();

  return (
    <Layout>
      <HeroSection w={w} />
      <PlatformStructureSection />
      <PlatformBenefitsSection />
      <RightsMarquee />
      <PremiumRoadmapSection />
      <LandingCTASection />
      <PlatformStatsBar />
    </Layout>
  );
}
