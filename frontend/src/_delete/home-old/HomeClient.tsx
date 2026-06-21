"use client";

import { Layout } from "@/components/layout/Layout";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useLaws } from "@/hooks/useLaws";
import { HeroSection } from "@/components/home/HeroSection";
import { StepsSection } from "@/components/home/StepsSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { RightsMarquee } from "@/components/home/RightsMarquee";
import { RoadmapSection } from "@/components/home/RoadmapSection";

export function HomeClient() {
  const w = useWindowWidth();
  const { laws, loading, error } = useLaws();

  return (
    <Layout>
      <HeroSection w={w} />
      <StepsSection />
      <FeaturesSection />
      <RightsMarquee />
      <RoadmapSection laws={laws} loading={loading} error={error} />
    </Layout>
  );
}
