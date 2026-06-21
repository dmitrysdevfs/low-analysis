import type { Law } from "@/types";
import type {
  Radiant1ApiEdge,
  Radiant1BuildInput,
  Radiant1ClusterMeta,
  Radiant1GraphData,
  Radiant1GraphLink,
  Radiant1GraphNode,
  Radiant1MergedLaw,
} from "../types";

const CLUSTERS: Radiant1ClusterMeta[] = [
  {
    id: "constitution",
    label: "Конституційний",
    color: "#f7bf54",
    glow: "rgba(247, 191, 84, 0.42)",
    keywords: ["конституц"],
  },
  {
    id: "criminal",
    label: "Кримінальний",
    color: "#f26767",
    glow: "rgba(242, 103, 103, 0.42)",
    keywords: ["кримін", "поліці"],
  },
  {
    id: "finance",
    label: "Фінансовий",
    color: "#68d884",
    glow: "rgba(104, 216, 132, 0.44)",
    keywords: ["фінанс", "платіж", "економ", "споживач"],
  },
  {
    id: "civil",
    label: "Цивільний",
    color: "#7ec8ff",
    glow: "rgba(126, 200, 255, 0.44)",
    keywords: ["цивіль"],
  },
  {
    id: "public",
    label: "Публічний",
    color: "#ee9c6f",
    glow: "rgba(238, 156, 111, 0.42)",
    keywords: ["держав", "служб", "корупц", "освіт"],
  },
  {
    id: "agrarian",
    label: "Аграрний",
    color: "#bf8ef5",
    glow: "rgba(191, 142, 245, 0.42)",
    keywords: ["фермер", "земель"],
  },
  {
    id: "other",
    label: "Закон України",
    color: "#6f8dff",
    glow: "rgba(111, 141, 255, 0.42)",
    keywords: [],
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toShortLabel(law: Law | undefined, fallbackCode: string) {
  if (fallbackCode) return fallbackCode;
  const title = law?.title?.trim() ?? "";
  if (!title) return "LAW";
  return title.length > 18 ? `${title.slice(0, 18)}…` : title;
}

function resolveCluster(lawType: string, title: string) {
  const haystack = `${lawType} ${title}`.toLowerCase();
  return (
    CLUSTERS.find((cluster) =>
      cluster.keywords.some((keyword) => haystack.includes(keyword)),
    ) ?? CLUSTERS[CLUSTERS.length - 1]
  );
}

function computeDegree(edges: Radiant1ApiEdge[]) {
  const map = new Map<string, number>();
  for (const edge of edges) {
    map.set(edge.source, (map.get(edge.source) ?? 0) + 1);
    if (edge.target !== edge.source) {
      map.set(edge.target, (map.get(edge.target) ?? 0) + 1);
    }
  }
  return map;
}

function parseYear(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  const year = date.getFullYear();
  return Number.isNaN(year) ? undefined : year;
}

function matchesSearch(
  query: string,
  law: Radiant1MergedLaw,
  cluster: Radiant1ClusterMeta,
) {
  if (!query.trim()) return true;
  const haystack = [
    law.apiNode.label,
    law.apiNode.code,
    law.law?.title,
    law.law?.status,
    law.law?.documentType?.join(" "),
    cluster.label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function buildClusterCenters(clusterIds: string[]) {
  const positions = new Map<string, { x: number; y: number; angle: number }>();
  const radius = 410;
  clusterIds.forEach((clusterId, index) => {
    const angle =
      -Math.PI / 2 + (index / Math.max(clusterIds.length, 1)) * Math.PI * 2;
    positions.set(clusterId, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.78,
      angle,
    });
  });
  return positions;
}

function makeArticleBuckets(totalArticles: number, degree: number) {
  const count = clamp(Math.round(Math.log2(totalArticles + 8)) + degree, 4, 14);
  const step = Math.max(1, Math.ceil(Math.max(totalArticles, 1) / count));
  return Array.from({ length: count }, (_, index) => {
    const start = index * step + 1;
    const end = Math.min(totalArticles, start + step - 1);
    return {
      start,
      end,
      label: start === end ? `Ст. ${start}` : `Ст. ${start}-${end}`,
    };
  });
}

function makeSectionBuckets(totalSections: number) {
  const count = clamp(Math.round(totalSections / 3), 1, 4);
  const step = Math.max(1, Math.ceil(Math.max(totalSections, 1) / count));
  return Array.from({ length: count }, (_, index) => {
    const start = index * step + 1;
    const end = Math.min(totalSections, start + step - 1);
    return {
      label: start === end ? `Розд. ${start}` : `Розд. ${start}-${end}`,
    };
  });
}

function makeDefinitionBuckets(definitionsCount: number) {
  if (definitionsCount <= 0) return [];
  const count = clamp(Math.round(definitionsCount / 5), 1, 4);
  const step = Math.max(1, Math.ceil(definitionsCount / count));
  return Array.from({ length: count }, (_, index) => {
    const start = index * step + 1;
    const end = Math.min(definitionsCount, start + step - 1);
    return {
      label: start === end ? `Термін ${start}` : `Терміни ${start}-${end}`,
    };
  });
}

function findArticleBucketId(
  articleBucketsByLaw: Map<
    string,
    Array<{ id: string; start: number; end: number }>
  >,
  lawId: string,
  article: string | null | undefined,
) {
  if (!article) return null;
  const number = Number.parseInt(article, 10);
  if (!Number.isFinite(number)) return null;
  const match = articleBucketsByLaw
    .get(lawId)
    ?.find((bucket) => number >= bucket.start && number <= bucket.end);
  return match?.id ?? null;
}

export function getRadiant1Clusters() {
  return CLUSTERS;
}

export function buildRadiant1Graph({
  graph,
  laws,
  lawSubjectIdsByLaw,
  searchQuery,
  activeClusterIds,
  selectedSubjectId,
  selectedYear,
  selectedYearFrom,
  pathLawIds,
}: Radiant1BuildInput): Radiant1GraphData {
  const lawsById = new Map<string, Law>(laws.map((law) => [law._id, law]));
  const degreeMap = computeDegree(graph.edges);

  const mergedLaws: Radiant1MergedLaw[] = graph.nodes.map((apiNode) => {
    const law = lawsById.get(apiNode.id);
    const cluster = resolveCluster(apiNode.type ?? "law", apiNode.label);
    return {
      apiNode,
      law,
      cluster,
      subjectIds:
        lawSubjectIdsByLaw.get(apiNode.id) ?? apiNode.subjectIds ?? [],
      adoptedYear: parseYear(law?.adoptedDate),
      definitionsCount: law?.global_context?.definitions?.length ?? 0,
      totalSections: law?.totalSections ?? 0,
      totalArticles: law?.totalArticles ?? apiNode.totalArticles ?? 0,
      totalParagraphs: law?.totalParagraphs ?? 0,
      degree: degreeMap.get(apiNode.id) ?? 0,
    };
  });

  const filteredLaws = mergedLaws
    .filter((law) =>
      activeClusterIds.length === 0
        ? true
        : activeClusterIds.includes(law.cluster.id),
    )
    .filter((law) => matchesSearch(searchQuery, law, law.cluster))
    .filter((law) =>
      selectedYear == null || law.adoptedYear == null
        ? true
        : law.adoptedYear <= selectedYear,
    )
    .filter((law) =>
      selectedYearFrom == null || law.adoptedYear == null
        ? true
        : law.adoptedYear >= selectedYearFrom,
    )
    .filter((law) =>
      selectedSubjectId ? law.subjectIds.includes(selectedSubjectId) : true,
    );

  const visibleLawIds = new Set(filteredLaws.map((law) => law.apiNode.id));

  const visibleEdges = graph.edges.filter(
    (edge) => visibleLawIds.has(edge.source) && visibleLawIds.has(edge.target),
  );

  const primaryLaw =
    [...filteredLaws].sort(
      (left, right) =>
        right.degree - left.degree ||
        right.totalArticles - left.totalArticles ||
        left.apiNode.label.localeCompare(right.apiNode.label),
    )[0] ?? null;

  const clusterIds = Array.from(
    new Set(filteredLaws.map((law) => law.cluster.id)),
  );
  const clusterCenters = buildClusterCenters(clusterIds);

  const nodes: Radiant1GraphNode[] = [];
  const links: Radiant1GraphLink[] = [];
  const articleBucketsByLaw = new Map<
    string,
    Array<{ id: string; start: number; end: number }>
  >();

  const lawsByCluster = new Map<string, Radiant1MergedLaw[]>();
  filteredLaws.forEach((law) => {
    const bucket = lawsByCluster.get(law.cluster.id) ?? [];
    bucket.push(law);
    lawsByCluster.set(law.cluster.id, bucket);
  });

  for (const [clusterId, group] of lawsByCluster.entries()) {
    group.sort(
      (left, right) =>
        right.degree - left.degree || right.totalArticles - left.totalArticles,
    );

    const center = clusterCenters.get(clusterId) ?? { x: 0, y: 0, angle: 0 };

    group.forEach((law, index) => {
      const isPrimary = law.apiNode.id === primaryLaw?.apiNode.id;
      const laneIndex = index % 6;
      const ring = 68 + Math.floor(index / 6) * 58;
      const arcSpread =
        group.length === 1
          ? 0
          : (laneIndex / (group.length - 1 || 1) - 0.5) * 1.6;
      const angle = center.angle + arcSpread;
      const x = isPrimary ? 0 : center.x + Math.cos(angle) * ring;
      const y = isPrimary ? 0 : center.y + Math.sin(angle) * ring;

      const lawNode: Radiant1GraphNode = {
        id: law.apiNode.id,
        label: law.apiNode.label,
        shortLabel: toShortLabel(law.law, law.apiNode.code),
        kind: "law",
        lawId: law.apiNode.id,
        lawTitle: law.apiNode.label,
        lawCode: law.apiNode.code,
        lawType: law.apiNode.type ?? "law",
        clusterId: law.cluster.id,
        clusterLabel: law.cluster.label,
        color: law.cluster.color,
        glow: law.cluster.glow,
        size: clamp(
          12 + Math.log2(Math.max(law.totalArticles, 1)) * 2.6,
          14,
          24,
        ),
        x,
        y,
        fx: x,
        fy: y,
        degree: law.degree,
        totalArticles: law.totalArticles,
        totalSections: law.totalSections,
        totalParagraphs: law.totalParagraphs,
        definitionsCount: law.definitionsCount,
        adoptedYear: law.adoptedYear,
        subjectIds: law.subjectIds,
        subjectCount: law.subjectIds.length,
        detail: law.law?.status ?? "чинний",
        isPrimary,
        isPath: pathLawIds?.has(law.apiNode.id) ?? false,
      };

      nodes.push(lawNode);

      const sectionBuckets = makeSectionBuckets(law.totalSections);
      const definitionBuckets = makeDefinitionBuckets(law.definitionsCount);
      const articleBuckets = makeArticleBuckets(law.totalArticles, law.degree);

      const sectionRadius = lawNode.size + 26;
      const definitionRadius = lawNode.size + 44;
      const articleRadius = lawNode.size + 68;

      sectionBuckets.forEach((bucket, bucketIndex) => {
        const theta =
          (-Math.PI / 2 + (bucketIndex / sectionBuckets.length) * Math.PI * 2) *
          0.96;
        const sectionNode: Radiant1GraphNode = {
          ...lawNode,
          id: `${law.apiNode.id}:section:${bucketIndex}`,
          label: bucket.label,
          shortLabel: bucket.label,
          kind: "section",
          size: 4.2,
          x: x + Math.cos(theta) * sectionRadius,
          y: y + Math.sin(theta) * sectionRadius,
          fx: x + Math.cos(theta) * sectionRadius,
          fy: y + Math.sin(theta) * sectionRadius,
          detail: "Структурний блок закону",
        };
        nodes.push(sectionNode);
        links.push({
          id: `${law.apiNode.id}:section-link:${bucketIndex}`,
          source: lawNode.id,
          target: sectionNode.id,
          kind: "satellite",
          weight: 1,
          confidence: 1,
          color: "rgba(122, 152, 192, 0.28)",
          particleColor: law.cluster.color,
        });
      });

      definitionBuckets.forEach((bucket, bucketIndex) => {
        const theta =
          Math.PI / 6 +
          (bucketIndex / Math.max(definitionBuckets.length, 1)) * Math.PI * 2;
        const definitionNode: Radiant1GraphNode = {
          ...lawNode,
          id: `${law.apiNode.id}:definition:${bucketIndex}`,
          label: bucket.label,
          shortLabel: bucket.label,
          kind: "definition",
          size: 3.9,
          x: x + Math.cos(theta) * definitionRadius,
          y: y + Math.sin(theta) * definitionRadius,
          fx: x + Math.cos(theta) * definitionRadius,
          fy: y + Math.sin(theta) * definitionRadius,
          detail: "Блок дефініцій та термінів",
        };
        nodes.push(definitionNode);
        links.push({
          id: `${law.apiNode.id}:definition-link:${bucketIndex}`,
          source: lawNode.id,
          target: definitionNode.id,
          kind: "satellite",
          weight: 1,
          confidence: 1,
          color: "rgba(122, 152, 192, 0.24)",
          particleColor: law.cluster.color,
        });
      });

      const articleNodes: Array<{ id: string; start: number; end: number }> =
        [];
      articleBuckets.forEach((bucket, bucketIndex) => {
        const theta =
          Math.PI / 10 + (bucketIndex / articleBuckets.length) * Math.PI * 2;
        const articleNodeId = `${law.apiNode.id}:article:${bucketIndex}`;
        articleNodes.push({
          id: articleNodeId,
          start: bucket.start,
          end: bucket.end,
        });
        const articleNode: Radiant1GraphNode = {
          ...lawNode,
          id: articleNodeId,
          label: bucket.label,
          shortLabel: bucket.label,
          kind: "article",
          size: 3.2,
          x: x + Math.cos(theta) * articleRadius,
          y: y + Math.sin(theta) * articleRadius,
          fx: x + Math.cos(theta) * articleRadius,
          fy: y + Math.sin(theta) * articleRadius,
          detail: "Пакет статей та норм",
          articleRange: bucket.label,
        };
        nodes.push(articleNode);
        links.push({
          id: `${law.apiNode.id}:article-link:${bucketIndex}`,
          source: lawNode.id,
          target: articleNode.id,
          kind: "satellite",
          weight: 1,
          confidence: 1,
          color: "rgba(122, 152, 192, 0.2)",
          particleColor: law.cluster.color,
        });
      });
      articleBucketsByLaw.set(law.apiNode.id, articleNodes);
    });
  }

  visibleEdges.forEach((edge) => {
    const sourceLaw = filteredLaws.find(
      (law) => law.apiNode.id === edge.source,
    );
    const targetLaw = filteredLaws.find(
      (law) => law.apiNode.id === edge.target,
    );
    if (!sourceLaw || !targetLaw) return;
    const color =
      sourceLaw.cluster.id === targetLaw.cluster.id
        ? sourceLaw.cluster.color
        : "rgba(236, 231, 219, 0.72)";
    links.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      kind: "law-ref",
      refType: edge.type,
      weight: edge.weight ?? 1,
      confidence: edge.confidence ?? 0.7,
      color,
      particleColor: targetLaw.cluster.color,
      fromArticle: edge.fromArticle ?? null,
      toArticle: edge.toArticle ?? null,
      rawText: edge.rawText ?? null,
      note: edge.rawText
        ? edge.rawText.replace(/\s+/g, " ").trim()
        : "Зв'язок між законами",
      isPath:
        (pathLawIds?.has(edge.source) ?? false) &&
        (pathLawIds?.has(edge.target) ?? false),
    });

    const articleBucketId = findArticleBucketId(
      articleBucketsByLaw,
      edge.source,
      edge.fromArticle,
    );

    if (articleBucketId) {
      links.push({
        id: `${edge.id}:article`,
        source: articleBucketId,
        target: edge.target,
        kind: "article-ref",
        refType: edge.type,
        weight: edge.weight ?? 1,
        confidence: edge.confidence ?? 0.7,
        color: "rgba(255, 255, 255, 0.28)",
        particleColor: targetLaw.cluster.color,
        fromArticle: edge.fromArticle ?? null,
        toArticle: edge.toArticle ?? null,
        rawText: edge.rawText ?? null,
        note: edge.rawText
          ? `Ст. ${edge.fromArticle ?? "?"}: ${edge.rawText.replace(/\s+/g, " ").trim()}`
          : `Ст. ${edge.fromArticle ?? "?"} -> ${targetLaw.apiNode.code}`,
        isPath:
          (pathLawIds?.has(edge.source) ?? false) &&
          (pathLawIds?.has(edge.target) ?? false),
      });
    }
  });

  const years = filteredLaws
    .map((law) => law.adoptedYear)
    .filter((year): year is number => Number.isFinite(year));
  const clusterStats = CLUSTERS.map((cluster) => ({
    id: cluster.id,
    label: cluster.label,
    color: cluster.color,
    count: filteredLaws.filter((law) => law.cluster.id === cluster.id).length,
  })).filter((cluster) => cluster.count > 0);

  return {
    nodes,
    links,
    summary: {
      visibleLawCount: filteredLaws.length,
      totalNodes: nodes.length,
      totalLinks: links.length,
      actualLinkCount: visibleEdges.length,
      dominantLawId: primaryLaw?.apiNode.id ?? null,
      yearRange: {
        min: years.length ? Math.min(...years) : null,
        max: years.length ? Math.max(...years) : null,
      },
      clusterStats,
    },
    lawOptions: filteredLaws.map((law) => ({
      id: law.apiNode.id,
      label: law.apiNode.label,
      code: law.apiNode.code,
      clusterId: law.cluster.id,
    })),
  };
}
