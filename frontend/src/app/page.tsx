"use client";

import { Layout } from "@/components/layout/Layout";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useLaws } from "@/hooks/useLaws";
import { HeroSection } from "@/components/home/HeroSection";
import { StepsSection } from "@/components/home/StepsSection";
import { RoadmapSection } from "@/components/home/RoadmapSection";

export default function HomePage() {
  const w = useWindowWidth();
  const { laws, loading, error } = useLaws();

  return (
    <Layout>
      <HeroSection w={w} />
      <StepsSection />
      <RoadmapSection laws={laws} loading={loading} error={error} />
    </Layout>
  );
}
