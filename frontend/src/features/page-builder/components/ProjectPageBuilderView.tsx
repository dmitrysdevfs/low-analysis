"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import styles from "../PageBuilder.module.scss";

const PAGE_SLUG = "project-info";

function getBlockHeading(block: PageBuilderBlock) {
  switch (block.type) {
    case "quote":
      return block.data.author || block.type;
    default:
      return "title" in block.data && block.data.title
        ? block.data.title
        : block.type;
  }
}

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
  const [mode, setMode] = useState<"compose" | "preview">("compose");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!page) return;
    setDraft(cloneSnapshot(page.draft));
    setSelectedBlockId(page.draft.blocks[0]?.id ?? null);
    setIsDirty(false);
  }, [page]);

  const selectedBlock = useMemo(
    () => draft.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [draft.blocks, selectedBlockId],
  );

  const setSnapshot = (
    updater: (current: PageBuilderSnapshot) => PageBuilderSnapshot,
  ) => {
    setDraft((current) => {
      const next = updater(current);
      setIsDirty(true);
      return next;
    });
  };

  const handleAddBlock = (type: PageBuilderBlock["type"]) => {
    const definition = BLOCK_DEFINITIONS.find((item) => item.type === type);
    if (!definition) return;

    const block = definition.create();
    setSnapshot((current) => ({
      ...current,
      blocks: [...current.blocks, block],
    }));
    setSelectedBlockId(block.id);
    setMode("compose");
  };

  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setMode("compose");
  };

  const handleUpdateBlock = (nextBlock: PageBuilderBlock) => {
    setSnapshot((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === nextBlock.id ? nextBlock : block,
      ),
    }));
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = draft.blocks.find((item) => item.id === blockId);
    if (!block) return;

    const clone = duplicateBlock(block);
    setSnapshot((current) => {
      const index = current.blocks.findIndex((item) => item.id === blockId);
      const nextBlocks = [...current.blocks];
      nextBlocks.splice(index + 1, 0, clone);
      return {
        ...current,
        blocks: nextBlocks,
      };
    });
    setSelectedBlockId(clone.id);
  };

  const handleRemoveBlock = (blockId: string) => {
    setSnapshot((current) => {
      const nextBlocks = current.blocks.filter((block) => block.id !== blockId);
      return {
        ...current,
        blocks: nextBlocks,
      };
    });

    if (selectedBlockId === blockId) {
      const nextSelection =
        draft.blocks.find((block) => block.id !== blockId)?.id ?? null;
      setSelectedBlockId(nextSelection);
    }
  };

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    setSnapshot((current) => {
      const index = current.blocks.findIndex((block) => block.id === blockId);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.blocks.length)
        return current;

      const nextBlocks = [...current.blocks];
      const [block] = nextBlocks.splice(index, 1);
      nextBlocks.splice(targetIndex, 0, block);
      return { ...current, blocks: nextBlocks };
    });
  };

  const handleSaveDraft = async () => {
    const response = await saveDraft(draft);
    setDraft(cloneSnapshot(response.draft));
    setSelectedBlockId(response.draft.blocks[0]?.id ?? null);
    setNotice("Чернетку збережено.");
    setIsDirty(false);
  };

  const handlePublish = async () => {
    let currentPage = page;
    if (isDirty) {
      currentPage = await saveDraft(draft);
      setDraft(cloneSnapshot(currentPage.draft));
      setIsDirty(false);
    }

    const response = await publish();
    setDraft(cloneSnapshot(response.draft));
    setNotice(
      currentPage?.status === "published"
        ? "Публікацію оновлено."
        : "Сторінку опубліковано.",
    );
  };

  const handleUnpublish = async () => {
    await unpublish();
    setNotice("Сторінку знято з публікації.");
  };

  const handleRestore = async (version: number) => {
    const response = await restoreVersion(version);
    setDraft(cloneSnapshot(response.draft));
    setSelectedBlockId(response.draft.blocks[0]?.id ?? null);
    setIsDirty(false);
    setNotice(`Версію #${version} відновлено у draft.`);
  };

  if (loading) {
    return (
      <section className={styles.builderState}>
        Завантаження конструктора...
      </section>
    );
  }

  if (error) {
    return <section className={styles.builderState}>Помилка: {error}</section>;
  }

  return (
    <section className={styles.builderPage}>
      <header className={styles.builderTopbar}>
        <div>
          <span className={styles.builderEyebrow}>Admin page builder</span>
          <h1 className={styles.builderTitle}>Інформація про проєкт</h1>
          <p className={styles.builderDescription}>
            Керуйте текстом, блоками та виглядом публічної сторінки без
            редагування коду. Builder працює через draft, publish і version
            history.
          </p>
        </div>

        <div className={styles.builderTopbarActions}>
          <span
            className={`${styles.statusBadge} ${page?.status === "published" ? styles.statusPublished : styles.statusDraft}`}
          >
            {page?.status === "published" ? "Published" : "Draft only"}
          </span>
          <Link href={ROUTES.projectInfo} className={styles.actionSecondary}>
            Відкрити публічну сторінку
          </Link>
          <button
            type="button"
            className={styles.actionSecondary}
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? "Збереження..." : "Зберегти draft"}
          </button>
          <button
            type="button"
            className={styles.actionPrimary}
            onClick={handlePublish}
            disabled={publishing || saving}
          >
            {publishing ? "Публікація..." : "Опублікувати"}
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={handleUnpublish}
            disabled={unpublishing}
          >
            {unpublishing ? "Зняття..." : "Unpublish"}
          </button>
        </div>
      </header>

      {notice && <div className={styles.noticeBar}>{notice}</div>}

      <div className={styles.builderGrid}>
        <aside className={styles.builderSidebar}>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarEyebrow}>Блоки</span>
            <h2>Додати секцію</h2>
            <p>
              Беріть готові шаблони блоків і збирайте сторінку як mini-CMS у
              стилі WordPress sections.
            </p>
          </div>

          <div className={styles.blockLibrary}>
            {BLOCK_DEFINITIONS.map((block) => (
              <button
                key={block.type}
                type="button"
                className={styles.libraryButton}
                onClick={() => handleAddBlock(block.type)}
              >
                <strong>{block.label}</strong>
                <span>{block.description}</span>
              </button>
            ))}
          </div>

          <div className={styles.sidebarSection}>
            <span className={styles.sidebarEyebrow}>Режим</span>
            <div className={styles.modeSwitcher}>
              <button
                type="button"
                className={`${styles.modeButton} ${mode === "compose" ? styles.modeButtonActive : ""}`}
                onClick={() => setMode("compose")}
              >
                Canvas
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${mode === "preview" ? styles.modeButtonActive : ""}`}
                onClick={() => setMode("preview")}
              >
                Preview
              </button>
            </div>
          </div>
        </aside>

        <div className={styles.builderCanvasColumn}>
          <div className={styles.pageMetaCard}>
            <div className={styles.pageMetaHeader}>
              <div>
                <span className={styles.sidebarEyebrow}>Page meta</span>
                <h2>Заголовок сторінки</h2>
              </div>
              <span className={styles.slugPill}>/{PAGE_SLUG}</span>
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    setSnapshot((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>SEO title</span>
                <input
                  type="text"
                  value={draft.seo.title}
                  onChange={(event) =>
                    setSnapshot((current) => ({
                      ...current,
                      seo: { ...current.seo, title: event.target.value },
                    }))
                  }
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Description</span>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(event) =>
                  setSnapshot((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>SEO description</span>
                <textarea
                  rows={3}
                  value={draft.seo.description}
                  onChange={(event) =>
                    setSnapshot((current) => ({
                      ...current,
                      seo: {
                        ...current.seo,
                        description: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className={styles.field}>
                <span>OG image URL</span>
                <input
                  type="text"
                  value={draft.seo.ogImage}
                  onChange={(event) =>
                    setSnapshot((current) => ({
                      ...current,
                      seo: { ...current.seo, ogImage: event.target.value },
                    }))
                  }
                />
              </label>
            </div>
          </div>

          {mode === "compose" ? (
            <div className={styles.canvasStack}>
              {draft.blocks.map((block, index) => (
                <article
                  key={block.id}
                  className={`${styles.canvasBlockCard} ${selectedBlockId === block.id ? styles.canvasBlockCardActive : ""}`}
                  draggable
                  onDragStart={() => setDraggedBlockId(block.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!draggedBlockId) return;
                    setSnapshot((current) => ({
                      ...current,
                      blocks: moveBlock(
                        current.blocks,
                        draggedBlockId,
                        block.id,
                      ),
                    }));
                    setDraggedBlockId(null);
                  }}
                >
                  <div className={styles.canvasBlockButton}>
                    <div className={styles.canvasBlockMeta}>
                      <span className={styles.canvasBlockType}>
                        {block.type}
                      </span>
                      <button
                        type="button"
                        className={styles.canvasBlockSelect}
                        onClick={() => handleSelectBlock(block.id)}
                      >
                        <strong>
                          {index + 1}. {getBlockHeading(block)}
                        </strong>
                      </button>
                      <small>
                        {block.enabled ? "Видимий" : "Прихований"} • variant{" "}
                        {block.variant}
                      </small>
                    </div>

                    <div className={styles.canvasBlockActions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => handleMoveBlock(block.id, "up")}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => handleMoveBlock(block.id, "down")}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => handleDuplicateBlock(block.id)}
                      >
                        Дубль
                      </button>
                    </div>
                  </div>

                  <div className={styles.canvasPreview}>
                    <ProjectPageRenderer
                      embedded
                      page={{
                        title: draft.title,
                        description: draft.description,
                        blocks: [block],
                      }}
                    />
                  </div>
                </article>
              ))}

              {draft.blocks.length === 0 && (
                <div className={styles.emptyCanvas}>
                  Додайте перший блок із лівої бібліотеки, щоб зібрати сторінку.
                </div>
              )}
            </div>
          ) : (
            <div className={styles.previewFrame}>
              <ProjectPageRenderer embedded page={draft} />
            </div>
          )}
        </div>

        <aside className={styles.builderInspector}>
          {selectedBlock ? (
            <BlockSettingsPanel
              block={selectedBlock}
              onChange={handleUpdateBlock}
              onDuplicate={() => handleDuplicateBlock(selectedBlock.id)}
              onRemove={() => handleRemoveBlock(selectedBlock.id)}
            />
          ) : (
            <div className={styles.inspectorPlaceholder}>
              Оберіть блок у canvas, щоб редагувати його поля та стилі.
            </div>
          )}

          <div className={styles.versionPanel}>
            <div className={styles.inspectorHeader}>
              <div>
                <span className={styles.inspectorEyebrow}>Version history</span>
                <h3>Відновлення</h3>
              </div>
            </div>

            <div className={styles.versionList}>
              {(page?.versions ?? []).map((version) => (
                <div key={version.version} className={styles.versionItem}>
                  <div>
                    <strong>#{version.version}</strong>
                    <p>
                      {version.kind} •{" "}
                      {new Date(version.savedAt).toLocaleString("uk-UA")}
                    </p>
                    <small>
                      {version.title} • {version.blockCount} блоків
                    </small>
                  </div>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => handleRestore(version.version)}
                    disabled={restoring}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
