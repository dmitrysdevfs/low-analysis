"use client";

import { Layout } from "@/components/Layout";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useLaws } from "@/hooks/useLaws";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { StepsSection } from "@/components/StepsSection";
import { RoadmapSection } from "@/components/RoadmapSection";

export default function HomePage() {
  const w = useWindowWidth();
  const { laws, loading } = useLaws();

  return (
    <Layout>
      <HeroSection w={w} />
      <StatsSection laws={laws} loading={loading} />
      <StepsSection />
      <RoadmapSection laws={laws} loading={loading} />
    </Layout>
  );
}
