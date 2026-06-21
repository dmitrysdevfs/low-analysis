"use client";

import { useMemo, useState } from "react";
import {
  Network,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  X,
} from "lucide-react";

import type {
  Graph1Filters,
  Graph1Mode,
  LawReferenceType,
  PathFinderState,
  GraphSubject,
} from "../types/graph1.types";
import styles from "./Graph1ControlPanel.module.scss";

const SUBJECT_VISIBLE_LIMIT = 20;

interface Graph1ControlPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalNodes: number;
  totalEdges: number;
  mode: Graph1Mode;
  onResetToGlobal: () => void;
  depth: 1 | 2 | 3;
  onDepthChange: (d: 1 | 2 | 3) => void;
  focusLawLabel?: string;
  filters: Graph1Filters;
  onFiltersChange: (f: Graph1Filters) => void;
  pathFinder: PathFinderState;
  onPathFinderChange: (p: Partial<PathFinderState>) => void;
  onFindPath: () => void;
  onClearPath: () => void;
  allLaws: { id: string; label: string; code: string }[];
  visibleLawIds: Set<string>;
  onToggleLawVisibility: (id: string) => void;
  onShowAllLaws: () => void;
  showFallback: boolean;
  onToggleFallback: () => void;
  onResetView: () => void;
  // Subject connections
  subjectData: GraphSubject[];
  selectedSubjectIds: string[];
  onToggleSubject: (id: string) => void;
  onClearSubjects: () => void;
  subjectSearch: string;
  onSubjectSearchChange: (q: string) => void;
}

const EDGE_TYPE_META: {
  value: LawReferenceType;
  label: string;
  color: string;
}[] = [
  { value: "direct", label: "Прямі", color: "#4a80d4" },
  { value: "blanket", label: "Бланкетні", color: "#f4a261" },
  { value: "reflexive", label: "Зворотні", color: "#52b788" },
  { value: "subject", label: "Суб'єктні", color: "#c8a843" },
];

export function Graph1ControlPanel({
  searchQuery,
  onSearchChange,
  totalNodes,
  totalEdges,
  mode,
  onResetToGlobal,
  depth,
  onDepthChange,
  focusLawLabel,
  filters,
  onFiltersChange,
  pathFinder,
  onPathFinderChange,
  onFindPath,
  onClearPath,
  allLaws,
  visibleLawIds,
  onToggleLawVisibility,
  onShowAllLaws,
  showFallback,
  onToggleFallback,
  onResetView,
  subjectData,
  selectedSubjectIds,
  onToggleSubject,
  onClearSubjects,
  subjectSearch,
  onSubjectSearchChange,
}: Graph1ControlPanelProps) {
  const [subjectOpen, setSubjectOpen] = useState(false);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjectData.slice(0, SUBJECT_VISIBLE_LIMIT);
    return subjectData
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [subjectData, subjectSearch]);

  function toggleEdgeType(type: LawReferenceType) {
    const has = filters.edgeTypes.includes(type);
    onFiltersChange({
      ...filters,
      edgeTypes: has
        ? filters.edgeTypes.filter((t) => t !== type)
        : [...filters.edgeTypes, type],
    });
  }

  return (
    <aside className={styles.panel}>
      {/* 1. Header */}
      <div className={styles.section}>
        <div className={styles.header}>
          <Network size={15} className={styles.headerIcon} />
          <span className={styles.headerTitle}>Граф законів</span>
        </div>
      </div>

      {/* 2. Search */}
      <div className={styles.section}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Пошук закону…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Stats */}
      <div className={styles.section}>
        <span className={styles.stats}>
          Вузлів: {totalNodes} | Зв'язків: {totalEdges}
        </span>
      </div>

      {/* 4. Mode */}
      {mode === "focus" && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Режим</div>
          {focusLawLabel && (
            <div className={styles.focusChip} title={focusLawLabel}>
              Фокус: {focusLawLabel}
            </div>
          )}
          <button className={styles.resetBtn} onClick={onResetToGlobal}>
            <ArrowLeft size={12} />
            Повернутись до глобального
          </button>
        </div>
      )}

      {/* 5. Depth (focus only) */}
      {mode === "focus" && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Глибина</div>
          <div className={styles.depthGroup}>
            {([1, 2, 3] as const).map((d) => (
              <button
                key={d}
                className={styles.depthBtn}
                data-active={depth === d ? "true" : undefined}
                onClick={() => onDepthChange(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Filters */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Фільтри зв'язків</div>
        {EDGE_TYPE_META.map(({ value, label, color }) => (
          <label key={value} className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={filters.edgeTypes.includes(value)}
              onChange={() => toggleEdgeType(value)}
            />
            <span className={styles.colorDot} style={{ background: color }} />
            <span className={styles.checkboxLabel}>{label}</span>
          </label>
        ))}

        <div className={styles.sliderRow}>
          <div className={styles.sliderLabel}>
            Мін. достовірність:{" "}
            {Math.round(filters.minConfidence * 100)}%
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(filters.minConfidence * 100)}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minConfidence: Number(e.target.value) / 100,
              })
            }
            className={styles.slider}
          />
        </div>
      </div>

      {/* 7. Path finder */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Знайти шлях між законами</div>

        <div className={styles.pathLabel}>Від:</div>
        <select
          className={styles.pathSelect}
          value={pathFinder.fromLawId ?? ""}
          onChange={(e) => {
            const found = allLaws.find((l) => l.id === e.target.value);
            onPathFinderChange({
              fromLawId: e.target.value || null,
              fromLawLabel: found?.label ?? "",
            });
          }}
        >
          <option value="">— Оберіть закон —</option>
          {allLaws.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} {l.label}
            </option>
          ))}
        </select>

        <div className={styles.pathLabel}>До:</div>
        <select
          className={styles.pathSelect}
          value={pathFinder.toLawId ?? ""}
          onChange={(e) => {
            const found = allLaws.find((l) => l.id === e.target.value);
            onPathFinderChange({
              toLawId: e.target.value || null,
              toLawLabel: found?.label ?? "",
            });
          }}
        >
          <option value="">— Оберіть закон —</option>
          {allLaws.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} {l.label}
            </option>
          ))}
        </select>

        <div className={styles.pathBtnRow}>
          <button
            className={styles.primaryBtn}
            onClick={onFindPath}
            disabled={
              !pathFinder.fromLawId ||
              !pathFinder.toLawId ||
              pathFinder.isLoading
            }
          >
            {pathFinder.isLoading ? "Шукаємо…" : "Знайти шлях"}
          </button>
          {(pathFinder.resultPath || pathFinder.error) && (
            <button className={styles.ghostBtn} onClick={onClearPath}>
              Скинути
            </button>
          )}
        </div>

        {pathFinder.isLoading && (
          <div className={styles.pathLoading}>Обчислення маршруту…</div>
        )}
        {pathFinder.resultPath && pathFinder.hops !== null && (
          <div className={styles.pathResult}>
            Шлях: {pathFinder.hops} кроків
          </div>
        )}
        {pathFinder.error && (
          <div className={styles.pathError}>{pathFinder.error}</div>
        )}
      </div>

      {/* 8. Law visibility selector */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          Показати закони
          {visibleLawIds.size > 0 && (
            <button className={styles.clearBtn} onClick={onShowAllLaws}>
              показати всі
            </button>
          )}
        </div>
        <div className={styles.lawCheckList}>
          {allLaws.map((l) => {
            const isVisible = visibleLawIds.size === 0 || visibleLawIds.has(l.id);
            return (
              <label key={l.id} className={styles.checkboxRow} title={l.label}>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggleLawVisibility(l.id)}
                />
                <span className={styles.lawCodeText}>{l.code}</span>
                <span className={styles.lawNameText}>{l.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 9. Subject connections */}
      <div className={styles.section}>
        <button
          className={styles.subjectToggleBtn}
          onClick={() => setSubjectOpen((v) => !v)}
        >
          <Users size={12} />
          <span>Зв&apos;язки по суб&apos;єктах</span>
          {selectedSubjectIds.length > 0 && (
            <span className={styles.subjectBadge}>{selectedSubjectIds.length}</span>
          )}
          <span className={styles.subjectChevron}>{subjectOpen ? "▲" : "▼"}</span>
        </button>

        {subjectOpen && (
          <div className={styles.subjectPanel}>
            {selectedSubjectIds.length > 0 && (
              <button className={styles.clearBtn} onClick={onClearSubjects}>
                <X size={10} />
                зняти всі
              </button>
            )}
            <div className={styles.searchWrap} style={{ marginBottom: 6 }}>
              <Search size={11} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                style={{ fontSize: "0.75rem", padding: "4px 8px 4px 26px" }}
                placeholder="Пошук суб'єкта…"
                value={subjectSearch}
                onChange={(e) => onSubjectSearchChange(e.target.value)}
              />
            </div>
            {subjectData.length === 0 ? (
              <div className={styles.subjectEmpty}>Дані завантажуються…</div>
            ) : (
              <div className={styles.subjectList}>
                {filteredSubjects.map((s) => (
                  <label key={s._id} className={styles.subjectRow}>
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(s._id)}
                      onChange={() => onToggleSubject(s._id)}
                    />
                    <span className={styles.subjectName} title={s.name}>
                      {s.name}
                    </span>
                    <span className={styles.subjectCount}>{s.count}</span>
                  </label>
                ))}
                {!subjectSearch && subjectData.length > SUBJECT_VISIBLE_LIMIT && (
                  <div className={styles.subjectMore}>
                    +{subjectData.length - SUBJECT_VISIBLE_LIMIT} більше — шукайте вище
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 10. Legend */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Легенда</div>
        {EDGE_TYPE_META.map(({ value, label, color }) => (
          <div key={value} className={styles.legendRow}>
            <span className={styles.legendLine} style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* 9. Actions */}
      <div className={styles.section}>
        <div className={styles.actionsRow}>
          <button className={styles.actionBtn} onClick={onResetView}>
            <RotateCcw size={13} />
            Скинути вид
          </button>
          <button
            className={styles.actionBtn}
            data-active={showFallback ? "true" : undefined}
            onClick={onToggleFallback}
          >
            {showFallback ? <EyeOff size={13} /> : <Eye size={13} />}
            Текстовий режим
          </button>
        </div>
      </div>
    </aside>
  );
}
