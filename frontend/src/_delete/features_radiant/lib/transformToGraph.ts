import { getLawColor, getLawSize, getLawCluster } from "./colorScheme";
import type {
  RadiantGraph,
  RadiantLink,
  RadiantNode,
} from "../types/radiant.types";

interface LawInput {
  _id?: string;
  title?: string;
  code?: string;
  documentType?: string[] | null;
  totalArticles?: number;
  adoptedDate?: string | null;
}

export function transformToGraph(laws: LawInput[]): RadiantGraph {
  const nodes: RadiantNode[] = laws.map((law) => {
    const lawType = law.documentType?.[0] || "закон";
    const title: string = law.title ?? "";
    const id: string = law._id ?? "";
    return {
      id,
      name: title,
      code: law.code ?? "",
      lawType,
      totalArticles: law.totalArticles ?? 0,
      adoptedYear: law.adoptedDate
        ? new Date(law.adoptedDate).getFullYear()
        : undefined,
      color: getLawColor(title, id),
      size: getLawSize(law.totalArticles ?? 0),
      cluster: getLawCluster(law.documentType || []),
    };
  });

  // Group nodes by cluster
  const clusterMap = new Map<string, RadiantNode[]>();
  for (const node of nodes) {
    const bucket = clusterMap.get(node.cluster) ?? [];
    bucket.push(node);
    clusterMap.set(node.cluster, bucket);
  }

  const links: RadiantLink[] = [];
  for (const [, clusterNodes] of clusterMap) {
    // Link consecutive pairs only (avoid N^2)
    for (let i = 0; i < clusterNodes.length - 1; i++) {
      links.push({
        source: clusterNodes[i].id,
        target: clusterNodes[i + 1].id,
        strength: 0.5,
        linkType: "type_cluster",
      });
    }
  }

  return { nodes, links };
}
