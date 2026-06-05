import type { GraphData, GraphEdge, GraphNode } from "../types/graph.types";
import type { Law, Subject } from "@/types";

const TYPE_COLOR_MAP: Record<string, string> = {
  кодекс: "#c8a843",
  кримінальний: "#e05252",
  цивільний: "#4a80d4",
  адміністративний: "#7a98c0",
  трудовий: "#52b788",
  господарський: "#f4a261",
};

export function getLawTypeColor(lawType: string): string {
  const lower = lawType.toLowerCase();
  for (const [key, color] of Object.entries(TYPE_COLOR_MAP)) {
    if (lower.includes(key)) return color;
  }
  return "#9eb5d9";
}

function resolveAdoptedYear(law: Law): number | undefined {
  if (!law.adoptedDate) return undefined;
  const year = new Date(law.adoptedDate).getFullYear();
  return isNaN(year) ? undefined : year;
}

function resolveLawType(law: Law): string {
  return law.documentType?.[0] ?? "law";
}

export function buildGraphFromData(
  laws: Law[],
  _subjects: Subject[],
): GraphData {
  const MAX_LAWS = 50;
  const slice = laws.slice(0, MAX_LAWS);

  const COLS = Math.ceil(Math.sqrt(slice.length));

  const nodes: GraphNode[] = slice.map((law, index) => ({
    id: law._id,
    type: "lawNode" as const,
    position: {
      x: (index % COLS) * 260,
      y: Math.floor(index / COLS) * 210,
    },
    data: {
      id: law._id,
      label: law.title,
      code: law.code,
      lawType: resolveLawType(law),
      totalArticles: law.totalArticles,
      adoptedYear: resolveAdoptedYear(law),
    },
  }));

  // Build subject-bridge edges: group laws by their documentType category
  const typeGroups = new Map<string, string[]>();
  for (const node of nodes) {
    const key = node.data.lawType.toLowerCase().split(" ")[0];
    if (!typeGroups.has(key)) typeGroups.set(key, []);
    typeGroups.get(key)!.push(node.id);
  }

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const [, group] of typeGroups) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length - 1; i++) {
      const source = group[i];
      const target = group[i + 1];
      const edgeKey = [source, target].sort().join("--");
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);
      edges.push({
        id: `e-${edgeKey}`,
        source,
        target,
        type: "referenceEdge" as const,
        data: { connectionType: "thematic" },
      });
    }
  }

  return { nodes, edges };
}
