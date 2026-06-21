import type { Metadata } from "next";
import { Graph1Page } from "@/features/graph1/components/Graph1Page";

export const metadata: Metadata = {
  title: "Граф зв'язків між нормами",
  description:
    "Візуалізація зв'язків між нормами законів України з фільтрацією, пошуком шляху та збереженням форків.",
};

export default async function GraphRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ fork?: string }>;
}) {
  const params = await searchParams;
  return <Graph1Page initialForkId={params.fork ?? null} />;
}
