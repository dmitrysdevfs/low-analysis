"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  AlignLeft,
  Zap,
  Quote,
  LayoutGrid,
  BarChart2,
  HelpCircle,
  ImageIcon,
  List,
  CheckSquare,
  Search,
  X,
} from "lucide-react";
import type { PageBuilderBlockType } from "@/types";
import styles from "../PageBuilder.module.scss";

type BlockItem = {
  type: PageBuilderBlockType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const CATEGORIES: { label: string; blocks: BlockItem[] }[] = [
  {
    label: "БАЗОВІ",
    blocks: [
      { type: "hero", label: "Hero", icon: LayoutTemplate },
      { type: "richText", label: "Текст", icon: AlignLeft },
      { type: "cta", label: "CTA", icon: Zap },
      { type: "quote", label: "Цитата", icon: Quote },
    ],
  },
  {
    label: "КОНТЕНТ",
    blocks: [
      { type: "cards", label: "Картки", icon: LayoutGrid },
      { type: "statsGrid", label: "Статистика", icon: BarChart2 },
      { type: "faq", label: "FAQ", icon: HelpCircle },
      { type: "image", label: "Зображення", icon: ImageIcon },
    ],
  },
  {
    label: "СТРУКТУРА",
    blocks: [
      { type: "steps", label: "Кроки", icon: List },
      { type: "radioGroup", label: "Вибір", icon: CheckSquare },
    ],
  },
];

interface Props {
  onAdd: (type: PageBuilderBlockType) => void;
}

export function BlockPalette({ onAdd }: Props) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    blocks: cat.blocks.filter(
      (b) =>
        !search ||
        b.label.toLowerCase().includes(search.toLowerCase()) ||
        b.type.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.blocks.length > 0);

  return (
    <div className={styles.palette}>
      <div className={styles.paletteHeader}>
        <div className={styles.paletteTitle}>ДОДАТИ БЛОК</div>
        <div className={styles.paletteTabs}>
          <button
            type="button"
            className={`${styles.paletteTab} ${tab === "all" ? styles.paletteTabActive : ""}`}
            onClick={() => setTab("all")}
          >
            Всі блоки
          </button>
          <button
            type="button"
            className={`${styles.paletteTab} ${tab === "mine" ? styles.paletteTabActive : ""}`}
            onClick={() => setTab("mine")}
          >
            Мої блоки
          </button>
        </div>
      </div>

      <div className={styles.paletteSearchWrap}>
        <Search size={13} className={styles.paletteSearchIcon} />
        <input
          className={styles.paletteSearchInput}
          placeholder="Пошук блоків..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className={styles.paletteSearchClear}
            onClick={() => setSearch("")}
          >
            <X size={11} />
          </button>
        )}
      </div>

      <div className={styles.paletteBody}>
        {tab === "mine" ? (
          <div className={styles.paletteEmpty}>Збережені блоки відсутні</div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.label} className={styles.paletteCategory}>
              <div className={styles.paletteCategoryLabel}>{cat.label}</div>
              <div className={styles.paletteCategoryGrid}>
                {cat.blocks.map((block) => {
                  const Icon = block.icon;
                  return (
                    <button
                      key={block.type}
                      type="button"
                      className={styles.paletteBlock}
                      onClick={() => onAdd(block.type)}
                      title={`Додати блок: ${block.label}`}
                    >
                      <Icon size={20} className={styles.paletteBlockIcon} />
                      <span className={styles.paletteBlockLabel}>
                        {block.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
