"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTaxonomies } from "@/lib/api";
import type { Taxonomy } from "@/types";

export function useTaxonomies() {
  const { data, isLoading } = useQuery<Taxonomy[], Error>({
    queryKey: ["taxonomies"],
    queryFn: ({ signal }) => getTaxonomies({ signal }),
    staleTime: 5 * 60_000,
  });

  const taxonomies = data ?? [];

  const taxonomyMap = useMemo(
    () => Object.fromEntries(taxonomies.map((t) => [t._id, t])),
    [taxonomies],
  );

  return { taxonomies, taxonomyMap, loading: isLoading };
}
