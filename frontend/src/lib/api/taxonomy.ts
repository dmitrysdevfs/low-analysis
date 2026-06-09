"use client";

import type { Taxonomy, TaxonomyTreeNode } from "@/types";
import { getJson } from "./_client";

export async function getTaxonomies(
  options?: RequestInit,
): Promise<Taxonomy[]> {
  return getJson<Taxonomy[]>("/taxonomies", options);
}

export async function getTaxonomyTree(
  options?: RequestInit,
): Promise<TaxonomyTreeNode[]> {
  return getJson<TaxonomyTreeNode[]>("/taxonomies/tree", options);
}
