"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  Globe,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  History,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { PageBuilderBlock, PageBuilderSnapshot } from "@/types";
import {
  BLOCK_DEFINITIONS,
  cloneSnapshot,
  createEmptySnapshot,
  duplicateBlock,
  moveBlock,
} from "../lib/pageBuilderBlocks";
import { useProjectPageBuilder } from "../hooks/useProjectPageBuilder";
import { ProjectPageRenderer } from "./ProjectPageRenderer";
import { BlockSettingsPanel } from "./BlockSettingsPanel";
import { BlockPalette } from "./BlockPalette";
import { PageSettingsPanel, type PageSettings } from "./PageSettingsPanel";
import styles from "../PageBuilder.module.scss";

const PAGE_SLUG = "project-info";

type Device = "desktop" | "tablet" | "mobile";
type RightTab = "page" | "block";

const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: "Hero",
  richText: "Текст",
  statsGrid: "Статистика",
  cards: "Картки",
  steps: "Кроки",
  faq: "FAQ",
  cta: "CTA",
  radioGroup: "Вибір",
  quote: "Цитата",
  image: "Зображення",
};

export function ProjectPageBuilderView() {
  const {
    page,
    loading,
    error,
    saveDraft,
    publish,
    unpublish,
    restoreVersion,
    saving,
    publishing,
    unpublishing,
    restoring,
  } = useProjectPageBuilder(PAGE_SLUG);

  const [draft, setDraft] = useState<PageBuilderSnapshot>(
    createEmptySnapshot(),
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [rightTab, setRightTab] = useState<RightTab>("page");
  const [notice, setNotice] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    name: "Головна сторінка",
    slug: PAGE_SLUG,
    template: "basic",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    showInMenu: true,
    showInFooter: true,
    indexable: true,
  });

  useEffect(() => {
    if (!page) return;
    setDraft(cloneSnapshot(page.draft));
    setSelectedBlockId(page.draft.blocks[0]?.id ?? null);
    setIsDirty(false);
    setPageSettings((s) => ({ ...s, status: page.status }));
  }, [page]);

  const selectedBlock = useMemo(
    () => draft.blocks.find((b) => b.id === selectedBlockId) ?? null,
    [draft.blocks, selectedBlockId],
  );

  const setSnapshot = (
    updater: (c: PageBuilderSnapshot) => PageBuilderSnapshot,
  ) => {
    setDraft((c) => {
      const next = updater(c);
      setIsDirty(true);
      return next;
    });
  };

  const handleAddBlock = (type: PageBuilderBlock["type"]) => {
    const def = BLOCK_DEFINITIONS.find((d) => d.type === type);
    if (!def) return;
    const block = def.create();
    setSnapshot((c) => ({ ...c, blocks: [...c.blocks, block] }));
    setSelectedBlockId(block.id);
    setRightTab("block");
    setTimeout(() => {
      canvasViewportRef.current?.scrollTo({
        top: canvasViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setRightTab("block");
  };

  const handleUpdateBlock = (nextBlock: PageBuilderBlock) => {
    setSnapshot((c) => ({
      ...c,
      blocks: c.blocks.map((b) => (b.id === nextBlock.id ? nextBlock : b)),
    }));
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = draft.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const clone = duplicateBlock(block);
    setSnapshot((c) => {
      const idx = c.blocks.findIndex((b) => b.id === blockId);
      const next = [...c.blocks];
      next.splice(idx + 1, 0, clone);
      return { ...c, blocks: next };
    });
    setSelectedBlockId(clone.id);
  };

  const handleRemoveBlock = (blockId: string) => {
    setSnapshot((c) => ({
      ...c,
      blocks: c.blocks.filter((b) => b.id !== blockId),
    }));
    if (selectedBlockId === blockId) {
      const next = draft.blocks.find((b) => b.id !== blockId)?.id ?? null;
      setSelectedBlockId(next);
    }
  };

  const handleMoveBlock = (blockId: string, dir: "up" | "down") => {
    setSnapshot((c) => {
      const idx = c.blocks.findIndex((b) => b.id === blockId);
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= c.blocks.length) return c;
      const next = [...c.blocks];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...c, blocks: next };
    });
  };

  const handleSaveDraft = async () => {
    try {
      const res = await saveDraft(draft);
      setDraft(cloneSnapshot(res.draft));
      setIsDirty(false);
      showNotice("Чернетку збережено");
    } catch {
      showNotice("Помилка збереження");
    }
  };

  const handlePublish = async () => {
    try {
      if (isDirty) await saveDraft(draft);
      const res = await publish();
      setDraft(cloneSnapshot(res.draft));
      setIsDirty(false);
      showNotice("Сторінку опубліковано");
    } catch {
      showNotice("Помилка публікації");
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublish();
      showNotice("Знято з публікації");
    } catch {
      showNotice("Помилка зняття");
    }
  };

  const handleRestore = async (version: number) => {
    try {
      const res = await restoreVersion(version);
      setDraft(cloneSnapshot(res.draft));
      setSelectedBlockId(res.draft.blocks[0]?.id ?? null);
      setIsDirty(false);
      showNotice(`Версію #${version} відновлено`);
    } catch {
      showNotice(`Помилка відновлення версії #${version}`);
    }
  };

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  }

  const isPublished = page?.status === "published";

  if (loading) {
    return (
      <div className={styles.builderState}>Завантаження конструктора...</div>
    );
  }
  if (error) {
    return <div className={styles.builderState}>Помилка: {error}</div>;
  }

  return (
    <div className={styles.builder}>
      {/* Topbar */}
      <header className={styles.builderTopbar}>
        <div className={styles.topbarLeft}>
          <nav className={styles.topbarBreadcrumb}>
            <span>Адмін</span>
            <ChevronRight size={12} className={styles.breadcrumbSep} />
            <span>Публічний сайт</span>
            <ChevronRight size={12} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbCurrent}>Конструктор</span>
          </nav>
          <div className={styles.topbarTitleRow}>
            <h1 className={styles.topbarTitle}>Конструктор сторінок</h1>
            <Link
              href={ROUTES.projectInfo}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.topbarSiteLink}
            >
              <Globe size={12} />
              Перейти на сайт
            </Link>
          </div>
        </div>

        <div className={styles.topbarRight}>
          {isDirty && <span className={styles.dirtyBadge}>Є зміни</span>}
          <div
            className={`${styles.statusPill} ${isPublished ? styles.statusPublished : styles.statusDraft}`}
          >
            {isPublished ? "Опубліковано" : "Чернетка"}
          </div>
          <button
            type="button"
            className={styles.btnTopbarSecondary}
            onClick={handleSaveDraft}
            disabled={saving}
          >
            <Save size={13} />
            {saving ? "Збереження..." : "Зберегти"}
          </button>
          <Link
            href={ROUTES.projectInfo}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnTopbarSecondary}
          >
            <Eye size={13} />
            Попередній перегляд
          </Link>
          <button
            type="button"
            className={styles.btnTopbarPublish}
            onClick={handlePublish}
            disabled={publishing || saving}
          >
            {publishing ? "Публікація..." : "Опублікувати"}
          </button>
          <button
            type="button"
            className={styles.btnTopbarKebab}
            onClick={handleUnpublish}
            disabled={unpublishing}
            title="Зняти з публікації"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {notice && <div className={styles.noticeBar}>{notice}</div>}

      {/* 3-column body */}
      <div className={styles.builderBody}>
        {/* Left: block palette */}
        <BlockPalette onAdd={handleAddBlock} />

        {/* Center: canvas */}
        <div className={styles.canvasColumn}>
          {/* Device switcher */}
          <div className={styles.canvasToolbar}>
            <div className={styles.deviceSwitcher}>
              <button
                type="button"
                className={`${styles.deviceBtn} ${device === "desktop" ? styles.deviceBtnActive : ""}`}
                onClick={() => setDevice("desktop")}
                title="Desktop"
              >
                <Monitor size={15} />
              </button>
              <button
                type="button"
                className={`${styles.deviceBtn} ${device === "tablet" ? styles.deviceBtnActive : ""}`}
                onClick={() => setDevice("tablet")}
                title="Tablet"
              >
                <Tablet size={15} />
              </button>
              <button
                type="button"
                className={`${styles.deviceBtn} ${device === "mobile" ? styles.deviceBtnActive : ""}`}
                onClick={() => setDevice("mobile")}
                title="Mobile"
              >
                <Smartphone size={15} />
              </button>
            </div>
            <div className={styles.canvasSlug}>/{PAGE_SLUG}</div>
          </div>

          {/* Canvas viewport */}
          <div className={styles.canvasViewport} ref={canvasViewportRef}>
            <div
              className={styles.canvasFrame}
              style={{ maxWidth: DEVICE_WIDTHS[device] }}
            >
              {draft.blocks.length === 0 ? (
                <div className={styles.canvasEmpty}>
                  <Plus size={28} />
                  <span>Додайте перший блок із бібліотеки зліва</span>
                </div>
              ) : (
                draft.blocks.map((block) => (
                  <div
                    key={block.id}
                    className={`${styles.canvasItem} ${selectedBlockId === block.id ? styles.canvasItemSelected : ""}`}
                    onClick={() => handleSelectBlock(block.id)}
                    draggable
                    onDragStart={() => setDraggedBlockId(block.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggedBlockId) return;
                      setSnapshot((c) => ({
                        ...c,
                        blocks: moveBlock(c.blocks, draggedBlockId, block.id),
                      }));
                      setDraggedBlockId(null);
                    }}
                  >
                    {/* Overlay toolbar */}
                    <div className={styles.blockOverlay}>
                      <span className={styles.blockOverlayLabel}>
                        {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                      </span>
                      <div className={styles.blockOverlayActions}>
                        <button
                          type="button"
                          className={styles.overlayBtn}
                          title="Вгору"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBlock(block.id, "up");
                          }}
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.overlayBtn}
                          title="Вниз"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBlock(block.id, "down");
                          }}
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.overlayBtn}
                          title="Налаштування"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBlock(block.id);
                          }}
                        >
                          <Settings size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.overlayBtn}
                          title="Дублювати"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateBlock(block.id);
                          }}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.overlayBtn} ${styles.overlayBtnDanger}`}
                          title="Видалити"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBlock(block.id);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* WYSIWYG render */}
                    <div className={styles.blockRender}>
                      <ProjectPageRenderer
                        embedded
                        page={{ ...draft, blocks: [block] }}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Add block CTA at bottom */}
              {draft.blocks.length > 0 && (
                <button
                  type="button"
                  className={styles.canvasAddBlockBtn}
                  onClick={() => handleAddBlock("hero")}
                >
                  <Plus size={14} />
                  Додати секцію
                </button>
              )}
            </div>
          </div>

          {/* DOM breadcrumb */}
          <div className={styles.canvasBreadcrumb}>
            {selectedBlock ? (
              <>
                <span className={styles.crumbItem}>
                  Секція ({BLOCK_TYPE_LABELS[selectedBlock.type]})
                </span>
                <ChevronRight size={11} className={styles.crumbSep} />
                <span className={styles.crumbItem}>Контейнер</span>
                <ChevronRight size={11} className={styles.crumbSep} />
                <span className={styles.crumbItem}>Блок</span>
                <ChevronRight size={11} className={styles.crumbSep} />
                <span
                  className={`${styles.crumbItem} ${styles.crumbItemActive}`}
                >
                  {selectedBlock.type}
                </span>
              </>
            ) : (
              <span className={styles.crumbItem} style={{ color: "#3a5070" }}>
                Оберіть блок для редагування
              </span>
            )}
          </div>
        </div>

        {/* Right: inspector */}
        <aside className={styles.rightPanel}>
          {/* Tabs */}
          <div className={styles.panelTabs}>
            <button
              type="button"
              className={`${styles.panelTab} ${rightTab === "page" ? styles.panelTabActive : ""}`}
              onClick={() => setRightTab("page")}
            >
              Нал. сторінки
            </button>
            <button
              type="button"
              className={`${styles.panelTab} ${rightTab === "block" ? styles.panelTabActive : ""}`}
              onClick={() => setRightTab("block")}
            >
              Нал. блоку
            </button>
          </div>

          {/* Panel content */}
          <div className={styles.panelContent}>
            {rightTab === "page" ? (
              <PageSettingsPanel
                settings={pageSettings}
                onChange={setPageSettings}
              />
            ) : selectedBlock ? (
              <BlockSettingsPanel
                block={selectedBlock}
                onChange={handleUpdateBlock}
                onDuplicate={() => handleDuplicateBlock(selectedBlock.id)}
                onRemove={() => handleRemoveBlock(selectedBlock.id)}
              />
            ) : (
              <div className={styles.panelPlaceholder}>
                Оберіть блок у canvas, щоб редагувати його поля та стилі.
              </div>
            )}
          </div>

          {/* Version history */}
          <div className={styles.versionSection}>
            <button
              type="button"
              className={styles.versionToggle}
              onClick={() => setShowVersions((v) => !v)}
            >
              <History size={13} />
              <span>Версії ({page?.versions?.length ?? 0})</span>
              <ChevronDown
                size={12}
                className={`${styles.versionToggleArrow} ${showVersions ? styles.versionToggleArrowOpen : ""}`}
              />
            </button>
            {showVersions && (
              <div className={styles.versionList}>
                {(page?.versions ?? []).length === 0 && (
                  <div className={styles.versionEmpty}>Версій поки немає</div>
                )}
                {(page?.versions ?? []).map((v) => (
                  <div key={v.version} className={styles.versionItem}>
                    <div className={styles.versionMeta}>
                      <span className={styles.versionNum}>#{v.version}</span>
                      <span className={styles.versionKind}>{v.kind}</span>
                    </div>
                    <div className={styles.versionInfo}>
                      {v.title} · {v.blockCount} блоків
                    </div>
                    <div className={styles.versionDate}>
                      {new Date(v.savedAt).toLocaleString("uk-UA", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <button
                      type="button"
                      className={styles.versionRestoreBtn}
                      onClick={() => handleRestore(v.version)}
                      disabled={restoring}
                    >
                      <RotateCcw size={11} />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
