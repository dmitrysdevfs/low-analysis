"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Filter,
  GitBranchPlus,
  Layers3,
  Network,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { fetchGraphPath } from "@/lib/api/graph1";
import { buildRadiant1Graph, getRadiant1Clusters } from "../lib/buildRadiant1Graph";
import { useRadiant1Data } from "../hooks/useRadiant1Data";
import { Radiant1Canvas } from "./Radiant1Canvas";
import styles from "./Radiant1Page.module.scss";

const CLUSTERS = getRadiant1Clusters();

function formatDateLabel(year: number | undefined) {
  return year ? String(year) : "Невідомо";
}

function edgeTypeLabel(type: string | undefined) {
  switch (type) {
    case "direct":
      return "Пряме посилання";
    case "blanket":
      return "Бланкетна норма";
    case "reflexive":
      return "Рефлексивний зв'язок";
    case "subject":
      return "Предметний зв'язок";
    default:
      return "Семантичний зв'язок";
  }
}

export function Radiant1Page() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [activeClusterIds, setActiveClusterIds] = useState<string[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [fromLawId, setFromLawId] = useState("");
  const [toLawId, setToLawId] = useState("");
  const [pathLawIds, setPathLawIds] = useState<string[]>([]);
  const [pathHops, setPathHops] = useState<number | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [resetView, setResetView] = useState<(() => void) | null>(null);
  const [pathPending, startPathTransition] = useTransition();
  const [, startFilterTransition] = useTransition();
  const [selectedYearFrom, setSelectedYearFrom] = useState<number | null>(null);
  const [isEmptyStateOpen, setIsEmptyStateOpen] = useState(false);
  const [articleRiskFilter, setArticleRiskFilter] = useState<"green" | "yellow" | "red" | null>(null);

  const handleResetReady = useCallback((fn: () => void) => {
    setResetView(() => fn);
  }, []);

  const selectedLawId = selectedNodeId?.split(":")[0] ?? null;
  const {
    globalGraphQuery,
    lawsQuery,
    selectedLawGraphQuery,
    selectedLawTreeQuery,
    lawSubjectIdsByLaw,
    subjectsMap,
    subjectsLoading,
  } = useRadiant1Data(selectedLawId);

  const laws = useMemo(() => lawsQuery.data ?? [], [lawsQuery.data]);

  const timelineYears = useMemo(() => {
    const years = laws
      .map((law) => {
        const year = law.adoptedDate ? new Date(law.adoptedDate).getFullYear() : NaN;
        return Number.isFinite(year) ? year : null;
      })
      .filter((year): year is number => year != null);

    return Array.from(new Set(years)).sort((left, right) => left - right);
  }, [laws]);

  useEffect(() => {
    if (selectedYear == null && timelineYears.length > 0) {
      setSelectedYear(timelineYears[timelineYears.length - 1]);
    }
  }, [selectedYear, timelineYears]);

  const subjectOptions = useMemo(() => {
    const counts = new Map<string, number>();

    lawSubjectIdsByLaw.forEach((subjectIds) => {
      subjectIds.forEach((subjectId) => {
        counts.set(subjectId, (counts.get(subjectId) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([subjectId, count]) => ({
        id: subjectId,
        label: subjectsMap.get(subjectId)?.canonical_name ?? subjectId,
        count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12);
  }, [lawSubjectIdsByLaw, subjectsMap]);

  const graph = useMemo(() => {
    if (!globalGraphQuery.data || laws.length === 0) {
      return null;
    }

    return buildRadiant1Graph({
      graph: globalGraphQuery.data,
      laws,
      lawSubjectIdsByLaw,
      searchQuery: deferredSearch,
      activeClusterIds,
      selectedSubjectId: selectedSubjectId === "all" ? null : selectedSubjectId,
      selectedYear,
      selectedYearFrom,
      pathLawIds: new Set(pathLawIds),
    });
  }, [
    activeClusterIds,
    deferredSearch,
    globalGraphQuery.data,
    lawSubjectIdsByLaw,
    laws,
    pathLawIds,
    selectedSubjectId,
    selectedYear,
    selectedYearFrom,
  ]);

  useEffect(() => {
    if (!graph?.summary.dominantLawId) {
      return;
    }

    setSelectedNodeId((current) => current ?? graph.summary.dominantLawId);
  }, [graph?.summary.dominantLawId]);

  useEffect(() => {
    setArticleRiskFilter(null);
  }, [selectedNodeId]);

  useEffect(() => {
    if (!graph || !selectedNodeId) {
      return;
    }

    if (!graph.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(graph.summary.dominantLawId);
      setSelectedEdgeId(null);
      setHoveredEdgeId(null);
    }
  }, [graph, selectedNodeId]);

  const selectedNode = useMemo(
    () => graph?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graph, selectedNodeId],
  );

  const hoveredEdge = useMemo(
    () => graph?.links.find((edge) => edge.id === hoveredEdgeId) ?? null,
    [graph, hoveredEdgeId],
  );

  const selectedEdge = useMemo(
    () => graph?.links.find((edge) => edge.id === selectedEdgeId) ?? null,
    [graph, selectedEdgeId],
  );

  const edgePreview = selectedEdge ?? hoveredEdge;

  const edgePreviewMeta = useMemo(() => {
    if (!edgePreview || !graph) return null;
    const sourceId =
      typeof edgePreview.source === "string"
        ? edgePreview.source
        : (edgePreview.source as { id: string }).id;
    const targetId =
      typeof edgePreview.target === "string"
        ? edgePreview.target
        : (edgePreview.target as { id: string }).id;
    const sourceNode = graph.nodes.find((n) => n.id === sourceId && n.kind === "law");
    const targetNode = graph.nodes.find((n) => n.id === targetId && n.kind === "law");
    const hasRealNote =
      edgePreview.note != null &&
      edgePreview.note !== "Зв'язок між законами" &&
      edgePreview.note.trim().length > 0;
    return { sourceNode, targetNode, hasRealNote };
  }, [edgePreview, graph]);

  const pathEdges = useMemo(() => {
    if (pathLawIds.length < 2 || !graph) return [];
    const pathSet = new Set(pathLawIds);
    return graph.links
      .filter((link) => {
        const sourceId = typeof link.source === "string" ? link.source : (link.source as { id: string }).id;
        const targetId = typeof link.target === "string" ? link.target : (link.target as { id: string }).id;
        return link.kind === "law-ref" && pathSet.has(sourceId) && pathSet.has(targetId);
      })
      .slice(0, 6);
  }, [pathLawIds, graph]);

  const selectedLawArticles = useMemo(() => {
    const elements = selectedLawTreeQuery.data?.elements ?? [];

    const fallbackArticles = elements
      .filter((element) => element.type === "article")
      .map((element) => ({
        id: element._id ?? element.code,
        label: element.title?.trim() || `Ст. ${element.number ?? "—"}`,
        meta: element.number != null ? `Стаття № ${element.number}` : "",
        riskLevel: element.risk_level as "green" | "yellow" | "red" | null | undefined,
      }));

    const referencedArticles = (selectedLawGraphQuery.data?.edges ?? [])
      .filter((edge) => edge.source === selectedLawId && edge.fromArticle)
      .map((edge) => ({
        id: edge.id,
        label: `Ст. ${edge.fromArticle}`,
        meta: edge.rawText?.replace(/\s+/g, " ").trim() || "",
        riskLevel: null as "green" | "yellow" | "red" | null,
      }))
      .slice(0, 40);

    return fallbackArticles.length > 0 ? fallbackArticles : referencedArticles;
  }, [selectedLawGraphQuery.data?.edges, selectedLawId, selectedLawTreeQuery.data?.elements]);

  const selectedLawSubjects = useMemo(() => {
    const counts = new Map<string, number>();

    (selectedLawTreeQuery.data?.elements ?? []).forEach((element) => {
      element.subjects?.forEach((subject) => {
        counts.set(subject.subject_id, (counts.get(subject.subject_id) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([subjectId, count]) => ({
        id: subjectId,
        label: subjectsMap.get(subjectId)?.canonical_name ?? subjectId,
        count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [selectedLawTreeQuery.data?.elements, subjectsMap]);

  const filteredArticles = useMemo(
    () =>
      articleRiskFilter
        ? selectedLawArticles.filter((a) => a.riskLevel === articleRiskFilter)
        : selectedLawArticles,
    [selectedLawArticles, articleRiskFilter],
  );

  const articleRiskCounts = useMemo(() => ({
    green:  selectedLawArticles.filter((a) => a.riskLevel === "green").length,
    yellow: selectedLawArticles.filter((a) => a.riskLevel === "yellow").length,
    red:    selectedLawArticles.filter((a) => a.riskLevel === "red").length,
  }), [selectedLawArticles]);

  const visibleLegend = graph?.summary.clusterStats ?? [];
  const visibleLawCount = graph?.summary.visibleLawCount ?? 0;
  const visibleLinkCount = graph?.summary.actualLinkCount ?? 0;
  const totalNodes = graph?.summary.totalNodes ?? 0;
  const totalLinks = graph?.summary.totalLinks ?? 0;
  const lawNodeCount = graph?.nodes.filter((n) => n.kind === "law").length ?? 0;
  const satelliteNodeCount = graph?.nodes.filter((n) => n.kind !== "law").length ?? 0;

  const selectedTimelineIndex =
    selectedYear != null
      ? Math.max(0, timelineYears.indexOf(selectedYear))
      : Math.max(0, timelineYears.length - 1);

  const isLoading =
    globalGraphQuery.isLoading || lawsQuery.isLoading || selectedYear == null;
  const hasError = globalGraphQuery.error || lawsQuery.error;

  const handleClusterToggle = (clusterId: string) => {
    startFilterTransition(() => {
      setActiveClusterIds((current) =>
        current.includes(clusterId)
          ? current.filter((item) => item !== clusterId)
          : [...current, clusterId],
      );
    });
  };

  const handleResetFilters = () => {
    startFilterTransition(() => {
      setSearchQuery("");
      setActiveClusterIds([]);
      setSelectedSubjectId("all");
      setPathLawIds([]);
      setPathHops(null);
      setPathError(null);
      setFromLawId("");
      setToLawId("");
      setSelectedYearFrom(null);

      if (timelineYears.length > 0) {
        setSelectedYear(timelineYears[timelineYears.length - 1]);
      }
    });

    setSelectedEdgeId(null);
    setHoveredEdgeId(null);
    resetView?.();
  };

  const handlePathFind = () => {
    if (!fromLawId || !toLawId) {
      return;
    }

    startPathTransition(async () => {
      try {
        const result = await fetchGraphPath(fromLawId, toLawId);
        setPathLawIds(result.path);
        setPathHops(result.hops);
        setPathError(null);
        setSelectedNodeId(result.path[0] ?? fromLawId);
      } catch (error) {
        setPathLawIds([]);
        setPathHops(null);
        setPathError(error instanceof Error ? error.message : "Шлях не знайдено");
      }
    });
  };

  if (isLoading) {
    return (
      <section className={styles.loadingShell}>
        <div className={styles.loadingCard}>
          <Sparkles size={22} />
          <div>
            <h1>Готуємо новий Radiant</h1>
            <p>Збираємо граф законів, структуру норм і візуальний шар нового інтерфейсу.</p>
          </div>
        </div>
      </section>
    );
  }

  if (hasError || !graph) {
    return (
      <section className={styles.loadingShell}>
        <div className={styles.errorCard}>
          <AlertTriangle size={22} />
          <div>
            <h1>Не вдалося зібрати Radiant1</h1>
            <p>{String(globalGraphQuery.error ?? lawsQuery.error ?? "Невідома помилка")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <motion.div
        className={styles.shell}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>РАДІАНТ</div>
            <p className={styles.brandSub}>3D-ВІЗУАЛІЗАЦІЯ ЗАКОНОДАВЧОЇ БАЗИ УКРАЇНИ</p>
          </div>

          <label className={styles.searchBar}>
            <Search size={15} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Пошук закону, коду, кластера..."
            />
          </label>

          <div className={styles.headerStats}>
            <span>{visibleLawCount} законів</span>
            <span>•</span>
            <span>{visibleLinkCount} зв&apos;язків</span>
            <span>•</span>
            <span>{selectedYear}</span>
          </div>

          <button
            type="button"
            className={styles.resetButton}
            onClick={handleResetFilters}
          >
            <RefreshCw size={14} />
            Скинути вид
          </button>
        </div>

        <div className={styles.modeTabs}>
          <button type="button" className={styles.modeTab} data-active="true">
            3D ВІЗУАЛІЗАЦІЯ
          </button>
          <button type="button" className={styles.modeTab}>
            4D ВІСЬ ЧАСУ
          </button>
          <button type="button" className={styles.modeTab}>
            SEMANTIC EDGES
          </button>
          <button type="button" className={styles.modeTab}>
            TECH NOTE (DOMINANT)
          </button>
          <button type="button" className={styles.modeTab}>
            DEVELOPER OVERLAY
          </button>
        </div>

        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <div className={styles.panel}>
              <div className={styles.panelHeading}>ПОШУК</div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Більше, ніж текстовий фільтр</span>
                <input
                  className={styles.control}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Назва / код / тип"
                />
              </label>

              <div className={styles.panelSubHeading}>ЧАСОВИЙ ДІАПАЗОН</div>
              <div className={styles.inlineGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Від:</span>
                  <select
                    className={styles.control}
                    value={selectedYearFrom ?? ""}
                    onChange={(e) =>
                      startFilterTransition(() =>
                        setSelectedYearFrom(e.target.value ? Number(e.target.value) : null),
                      )
                    }
                  >
                    <option value="">Від року</option>
                    {timelineYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>До:</span>
                  <select
                    className={styles.control}
                    value={selectedYear ?? ""}
                    onChange={(e) =>
                      startFilterTransition(() =>
                        setSelectedYear(e.target.value ? Number(e.target.value) : null),
                      )
                    }
                  >
                    <option value="">До року</option>
                    {timelineYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.inlineGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Тип закону</span>
                  <select
                    className={styles.control}
                    value=""
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) {
                        return;
                      }

                      handleClusterToggle(value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">Оберіть кластер</option>
                    {CLUSTERS.map((cluster) => (
                      <option key={cluster.id} value={cluster.id}>
                        {cluster.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Суб&apos;єкт</span>
                  <select
                    className={styles.control}
                    value={selectedSubjectId}
                    onChange={(event) =>
                      startFilterTransition(() => setSelectedSubjectId(event.target.value))
                    }
                  >
                    <option value="all">MVP-{subjectOptions.length} суб&apos;єктів</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.filterBlock}>
                <div className={styles.filterHeading}>
                  <Filter size={14} />
                  ПРАВОВА СФЕРА
                </div>

                <div className={styles.chipRow}>
                  {CLUSTERS.map((cluster) => (
                    <button
                      key={cluster.id}
                      type="button"
                      className={styles.filterChip}
                      data-active={
                        activeClusterIds.length === 0 || activeClusterIds.includes(cluster.id)
                          ? "true"
                          : undefined
                      }
                      onClick={() => handleClusterToggle(cluster.id)}
                    >
                      <span
                        className={styles.filterDot}
                        style={{ background: cluster.color }}
                      />
                      {cluster.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterBlock}>
                <div className={styles.filterHeading}>
                  <Route size={14} />
                  ШЛЯХОПОШУК
                </div>

                <div className={styles.inlineGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Норма 1</span>
                    <select
                      className={styles.control}
                      value={fromLawId}
                      onChange={(event) => setFromLawId(event.target.value)}
                    >
                      <option value="">Оберіть закон</option>
                      {graph.lawOptions.map((law) => (
                        <option key={law.id} value={law.id}>
                          {law.code} • {law.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Норма 2</span>
                    <select
                      className={styles.control}
                      value={toLawId}
                      onChange={(event) => setToLawId(event.target.value)}
                    >
                      <option value="">Оберіть закон</option>
                      {graph.lawOptions.map((law) => (
                        <option key={law.id} value={law.id}>
                          {law.code} • {law.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={handlePathFind}
                  disabled={!fromLawId || !toLawId || pathPending}
                >
                  <GitBranchPlus size={14} />
                  {pathPending ? "Шукаємо маршрут..." : "Прокласти semantic path"}
                </button>

                {pathHops != null ? (
                  <div className={styles.inlineHint}>
                    <Zap size={11} /> Маршрут знайдено: {pathHops} переходів
                  </div>
                ) : null}
                {pathError ? <div className={styles.errorHint}>{pathError}</div> : null}

                {pathEdges.length > 0 && (
                  <div className={styles.relatedNormsBlock}>
                    <div className={styles.filterHeading}>
                      <Route size={12} />
                      Пов&apos;язані норми
                    </div>
                    {pathEdges.map((edge) => (
                      <div key={edge.id} className={styles.relatedNormItem}>
                        <span className={styles.relatedNormText}>
                          {edge.fromArticle
                            ? `Ст. ${edge.fromArticle} із ${
                                typeof edge.source === "string" ? edge.source : (edge.source as { lawCode: string }).lawCode
                              } посилається на Ст. ${edge.toArticle ?? "?"} із ${
                                typeof edge.target === "string" ? edge.target : (edge.target as { lawCode: string }).lawCode
                              }`
                            : edge.note ?? "Семантичний зв'язок"}
                        </span>
                        <ChevronRight size={11} className={styles.relatedNormArrow} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.filterBlock}>
                <div className={styles.filterHeading}>
                  <Layers3 size={14} />
                  СТАТИСТИКА ГРАФУ
                </div>

                <dl className={styles.metricList}>
                  <div>
                    <dt>Вузли-закони</dt>
                    <dd>{lawNodeCount}</dd>
                  </div>
                  <div>
                    <dt>Вузли-супутники</dt>
                    <dd>{satelliteNodeCount}</dd>
                  </div>
                  <div>
                    <dt>Зв&apos;язки</dt>
                    <dd>{visibleLinkCount}</dd>
                  </div>
                  <div>
                    <dt>Всього норм</dt>
                    <dd>{subjectsLoading ? "…" : totalNodes}</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.emptyStateCard}>
                <button
                  type="button"
                  className={styles.emptyStateToggle}
                  onClick={() => setIsEmptyStateOpen((v) => !v)}
                >
                  <div className={styles.emptyStateIcon}>!</div>
                  <span>Стан показу</span>
                  <span className={styles.emptyStateBadge}>
                    {isEmptyStateOpen ? "Показано" : "Приховано"}
                  </span>
                  {isEmptyStateOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                {isEmptyStateOpen && (
                  <p className={styles.emptyStateBody}>
                    Цей екран уже працює від real graph API, але щільність мережі підсилена
                    article-сателітами, щоб новий Radiant виглядав як окремий premium mode,
                    а не як плаский список законів.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className={styles.stageColumn}>
            <div className={styles.stageCard}>
              <div className={styles.stageCanvas}>
                <Radiant1Canvas
                  graph={graph}
                  selectedNodeId={selectedNodeId}
                  selectedEdgeId={selectedEdgeId}
                  hoveredEdgeId={hoveredEdgeId}
                  onNodeSelect={(nodeId) => {
                    setSelectedNodeId(nodeId);
                    setSelectedEdgeId(null);
                  }}
                  onEdgeSelect={(edgeId) => {
                    setSelectedEdgeId(edgeId);
                  }}
                  onEdgeHover={setHoveredEdgeId}
                  onBackgroundClick={() => {
                    setSelectedEdgeId(null);
                    setHoveredEdgeId(null);
                  }}
                  onResetReady={handleResetReady}
                />

                <div className={styles.stageOverlayTop}>
                  <div className={styles.overlayPill}>
                    {visibleLinkCount} з {totalLinks}+ шляхів
                  </div>
                  <div className={styles.overlayPill}>4D ВІСЬ ЧАСУ</div>
                  <div className={`${styles.overlayPill} ${styles.overlayPillDev}`}>
                    TECH NOTE (DOMINANT)
                  </div>
                  <div className={`${styles.overlayPill} ${styles.overlayPillDev}`}>
                    DEVELOPER OVERLAY
                  </div>
                </div>

                {pathLawIds.length > 0 && (
                  <div className={styles.canvasPathPanel}>
                    <div className={styles.canvasPathLabel}>
                      <Route size={12} />
                      ШЛЯХОПОШУК
                    </div>
                    <div className={styles.canvasPathRow}>
                      <span className={styles.canvasPathNode}>
                        {fromLawId
                          ? graph.lawOptions.find((o) => o.id === fromLawId)?.code ?? fromLawId
                          : "Норма 1"}
                      </span>
                      <ChevronRight size={14} />
                      <span className={styles.canvasPathNode}>
                        {toLawId
                          ? graph.lawOptions.find((o) => o.id === toLawId)?.code ?? toLawId
                          : "Норма 2"}
                      </span>
                    </div>
                    {pathEdges.slice(0, 3).map((edge) => (
                      <div key={edge.id} className={styles.canvasPathNorm}>
                        <ChevronRight size={10} />
                        <span>
                          {edge.fromArticle
                            ? `Ст. ${edge.fromArticle} із ${
                                typeof edge.source === "string" ? edge.source : (edge.source as { lawCode: string }).lawCode
                              } змінює → Ст. ${edge.toArticle ?? "?"}`
                            : edge.note ?? "Семантичний зв'язок"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {edgePreview ? (
                    <motion.div
                      key={edgePreview.id}
                      className={styles.edgePreview}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <span className={styles.edgePreviewLabel}>
                        {edgeTypeLabel(edgePreview.refType)}
                      </span>
                      {edgePreviewMeta?.sourceNode && edgePreviewMeta?.targetNode && (
                        <div className={styles.edgePreviewRoute}>
                          <span className={styles.edgePreviewCode}>
                            {edgePreviewMeta.sourceNode.lawCode}
                          </span>
                          <ChevronRight size={11} />
                          <span className={styles.edgePreviewCode}>
                            {edgePreviewMeta.targetNode.lawCode}
                          </span>
                        </div>
                      )}
                      {edgePreviewMeta?.hasRealNote && (
                        <span className={styles.edgePreviewNote}>{edgePreview.note}</span>
                      )}
                      {edgePreview.fromArticle && (
                        <span className={styles.edgePreviewArticle}>
                          Ст.&nbsp;{edgePreview.fromArticle}
                          {edgePreview.toArticle ? ` → Ст. ${edgePreview.toArticle}` : ""}
                        </span>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {pathLawIds.length > 0 ? (
                  <div className={styles.pathOverlay}>
                    <span>Маршрут активний</span>
                    <strong>{pathLawIds.length} вузлів у ланцюжку</strong>
                  </div>
                ) : null}
              </div>

              <div className={styles.timelineCard}>
                <div className={styles.timelineHead}>
                  <span>4D ВІСЬ ЧАСУ</span>
                  <strong>{selectedYear}</strong>
                </div>

                <input
                  className={styles.timelineSlider}
                  type="range"
                  min={0}
                  max={Math.max(0, timelineYears.length - 1)}
                  value={selectedTimelineIndex}
                  onChange={(event) => {
                    const nextYear = timelineYears[Number(event.target.value)];
                    startFilterTransition(() => setSelectedYear(nextYear));
                  }}
                />

                <div className={styles.timelineMarks}>
                  {timelineYears.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={styles.timelineMark}
                      data-active={year === selectedYear ? "true" : undefined}
                      onClick={() => startFilterTransition(() => setSelectedYear(year))}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.legendCard}>
                <span className={styles.legendTitle}>ЛЕГЕНДА</span>
                <div className={styles.legendGrid}>
                  {visibleLegend.map((cluster) => (
                    <div key={cluster.id} className={styles.legendItem}>
                      <span
                        className={styles.legendDot}
                        style={{ background: cluster.color }}
                      />
                      <span>{cluster.label}</span>
                      <strong>{cluster.count}</strong>
                    </div>
                  ))}
                </div>
                <div className={styles.edgeLegendRow}>
                  <span className={styles.edgeLegendItem}>
                    <span className={styles.edgeSolid} /> Основний
                  </span>
                  <span className={styles.edgeLegendItem}>
                    <span className={styles.edgeArrow} /> Посилання
                  </span>
                  <span className={styles.edgeLegendItem}>
                    <span className={styles.edgeDashed} /> Семантичний
                  </span>
                  <span className={styles.edgeLegendItem}>
                    <span className={styles.edgeInfluence} /> Вплив
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className={styles.detailRail}>
            <div className={styles.detailCard}>
              <div className={styles.detailEyebrow}>ДЕТАЛІ ВУЗЛА</div>
              <h2>{selectedNode?.lawTitle ?? "Немає вибраного закону"}</h2>

              <div className={styles.detailMeta}>
                <span>
                  <strong>Назва:</strong>{" "}
                  {selectedNode?.label ?? "Оберіть вузол-закон або статтю"}
                </span>
                <span className={styles.clusterChipRow}>
                  <strong>Кластер:</strong>
                  {selectedNode ? (
                    <span
                      className={styles.clusterChip}
                      style={{
                        background: `${selectedNode.color}22`,
                        borderColor: `${selectedNode.color}55`,
                        color: selectedNode.color,
                      }}
                    >
                      <span
                        className={styles.clusterChipDot}
                        style={{ background: selectedNode.color }}
                      />
                      {selectedNode.clusterLabel}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
                <span>
                  <strong>Рік:</strong> {formatDateLabel(selectedNode?.adoptedYear)}
                </span>
                <span>
                  <strong>Кількість статей:</strong> {selectedNode?.totalArticles ?? 0}
                </span>
                <span>
                  <strong>Код закону:</strong>{" "}
                  <span style={{ color: "#7ec8ff", fontFamily: "var(--font-mono)" }}>
                    {selectedNode?.lawCode ?? "—"}
                  </span>
                </span>
                <span>
                  <strong>Суб&apos;єктів:</strong> {selectedNode?.subjectCount ?? 0}
                </span>
              </div>

              {selectedLawSubjects.length > 0 ? (
                <div className={styles.subjectRow}>
                  {selectedLawSubjects.map((subject, i) => (
                    <span key={`${subject.id || subject.label}-${i}`} className={styles.subjectChip}>
                      {subject.label}
                      <strong>{subject.count}</strong>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className={styles.articleList}>
                <div className={styles.listHeading}>
                  Статті / Норми
                  <span className={styles.articleCount}>{selectedLawArticles.length}</span>
                </div>

                {selectedLawArticles.length > 0 && (
                  <div className={styles.riskFilterBar}>
                    <button
                      type="button"
                      className={styles.riskFilterChip}
                      data-active={articleRiskFilter === null ? "true" : undefined}
                      onClick={() => setArticleRiskFilter(null)}
                    >
                      Всі
                    </button>
                    {articleRiskCounts.green > 0 && (
                      <button
                        type="button"
                        className={styles.riskFilterChip}
                        data-risk="green"
                        data-active={articleRiskFilter === "green" ? "true" : undefined}
                        onClick={() =>
                          setArticleRiskFilter((f) => (f === "green" ? null : "green"))
                        }
                      >
                        <span className={styles.riskDot} data-risk="green" />
                        Норма
                        <span className={styles.riskFilterCount}>{articleRiskCounts.green}</span>
                      </button>
                    )}
                    {articleRiskCounts.yellow > 0 && (
                      <button
                        type="button"
                        className={styles.riskFilterChip}
                        data-risk="yellow"
                        data-active={articleRiskFilter === "yellow" ? "true" : undefined}
                        onClick={() =>
                          setArticleRiskFilter((f) => (f === "yellow" ? null : "yellow"))
                        }
                      >
                        <span className={styles.riskDot} data-risk="yellow" />
                        Увага
                        <span className={styles.riskFilterCount}>{articleRiskCounts.yellow}</span>
                      </button>
                    )}
                    {articleRiskCounts.red > 0 && (
                      <button
                        type="button"
                        className={styles.riskFilterChip}
                        data-risk="red"
                        data-active={articleRiskFilter === "red" ? "true" : undefined}
                        onClick={() =>
                          setArticleRiskFilter((f) => (f === "red" ? null : "red"))
                        }
                      >
                        <span className={styles.riskDot} data-risk="red" />
                        Ризик
                        <span className={styles.riskFilterCount}>{articleRiskCounts.red}</span>
                      </button>
                    )}
                  </div>
                )}

                {filteredArticles.length > 0 ? (
                  <div className={styles.articleScrollBody}>
                    {filteredArticles.map((article) => (
                      <div key={article.id} className={styles.articleRow}>
                        <div className={styles.articleRowText}>
                          <strong>{article.label}</strong>
                          {article.meta ? <span>{article.meta}</span> : null}
                        </div>
                        {article.riskLevel ? (
                          <span className={styles.riskBadge} data-risk={article.riskLevel}>
                            {article.riskLevel === "green"
                              ? "Норма"
                              : article.riskLevel === "yellow"
                              ? "Увага"
                              : "Ризик"}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : selectedLawArticles.length > 0 ? (
                  <p className={styles.articleHint}>
                    Немає статей з таким рівнем ризику.
                  </p>
                ) : (
                  <p className={styles.articleHint}>
                    Для цього вузла ще немає даних або дерево закону завантажується.
                  </p>
                )}
              </div>

              <button
                type="button"
                className={styles.openLawButton}
                onClick={() => {
                  if (selectedLawId) {
                    router.push(ROUTES.law(selectedLawId));
                  }
                }}
                disabled={!selectedLawId}
              >
                <BookOpen size={14} />
                Відкрити закон
              </button>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.detailEyebrow}>СЕМАНТИЧНИЙ ЗВ&apos;ЯЗОК</div>

              {edgePreview && edgePreviewMeta ? (
                <div className={styles.edgeDetail}>
                  <div className={styles.edgeDetailRoute}>
                    <div className={styles.edgeDetailLaw}>
                      <span className={styles.edgeDetailDir}>Від</span>
                      <strong className={styles.edgeDetailCode}>
                        {edgePreviewMeta.sourceNode?.lawCode ?? "—"}
                      </strong>
                      <span className={styles.edgeDetailTitle}>
                        {edgePreviewMeta.sourceNode?.lawTitle ?? "—"}
                      </span>
                    </div>
                    <ChevronRight size={14} className={styles.edgeDetailArrow} />
                    <div className={styles.edgeDetailLaw}>
                      <span className={styles.edgeDetailDir}>До</span>
                      <strong className={styles.edgeDetailCode}>
                        {edgePreviewMeta.targetNode?.lawCode ?? "—"}
                      </strong>
                      <span className={styles.edgeDetailTitle}>
                        {edgePreviewMeta.targetNode?.lawTitle ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.edgeDetailRow}>
                    <span className={styles.edgeDetailKey}>Тип</span>
                    <span className={styles.edgeDetailVal}>
                      {edgeTypeLabel(edgePreview.refType)}
                    </span>
                  </div>

                  {edgePreview.fromArticle && (
                    <div className={styles.edgeDetailRow}>
                      <span className={styles.edgeDetailKey}>Стаття</span>
                      <span className={styles.edgeDetailVal}>
                        Ст.&nbsp;{edgePreview.fromArticle}
                        {edgePreview.toArticle ? ` → Ст. ${edgePreview.toArticle}` : ""}
                      </span>
                    </div>
                  )}

                  {edgePreviewMeta.hasRealNote && (
                    <div className={styles.edgeDetailNote}>
                      {edgePreview.note}
                    </div>
                  )}
                </div>
              ) : (
                <p className={styles.articleHint}>
                  Наведіть або клікніть на зв&apos;язок у графі, щоб побачити контекст.
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomMetric}>
            <Network size={14} />
            <div>
              <span>Граф</span>
              <strong>{visibleLinkCount} законодавчих зв&apos;язків</strong>
            </div>
          </div>

          <div className={styles.bottomMetric}>
            <CalendarRange size={14} />
            <div>
              <span>Хронологія</span>
              <strong>
                {timelineYears[0] ?? "—"} — {timelineYears[timelineYears.length - 1] ?? "—"}
              </strong>
            </div>
          </div>

          <div className={styles.bottomMetric}>
            <ShieldCheck size={14} />
            <div>
              <span>Якість даних</span>
              <strong>реальний API + деталізація дерева закону</strong>
            </div>
          </div>

          <div className={styles.bottomMetric}>
            <Sparkles size={14} />
            <div>
              <span>Режим</span>
              <strong>преміум-режим на базі Radiant</strong>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
