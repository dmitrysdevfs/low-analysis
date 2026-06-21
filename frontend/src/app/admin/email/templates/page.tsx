"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Wrench,
  Sparkles,
  Copy,
  Pencil,
  ArrowRight,
  Plus,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

const TEMPLATES = [
  {
    slug: "broadcast",
    name: "Широкомовлення",
    category: "Загальне",
    description: "Загальні оголошення для всіх або частини аудиторії. Ідеально для анонсів та новин.",
    fields: ["Заголовок", "Текст", "Кнопка CTA"],
    icon: Mail,
    iconColor: "#4a80d4",
    iconBg: "rgba(74,128,212,0.12)",
    usageCount: 12,
  },
  {
    slug: "maintenance",
    name: "Технічне обслуговування",
    category: "Системне",
    description: "Сповіщення про заплановані роботи або збої. Включає час початку та завершення.",
    fields: ["Заголовок", "Текст", "Час початку", "Час завершення", "Кнопка CTA"],
    icon: Wrench,
    iconColor: "#e9774b",
    iconBg: "rgba(233,119,75,0.12)",
    usageCount: 3,
  },
  {
    slug: "product-update",
    name: "Оновлення продукту",
    category: "Маркетинг",
    description: "Релізні нотатки та анонс нових функцій. Підтримує список нових можливостей.",
    fields: ["Заголовок", "Текст", "Список функцій", "Кнопка CTA"],
    icon: Sparkles,
    iconColor: "#c8a843",
    iconBg: "rgba(200,168,67,0.12)",
    usageCount: 7,
  },
];

const CATEGORIES = ["Всі", "Загальне", "Системне", "Маркетинг"];

export default function AdminEmailTemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Всі");
  const [duplicated, setDuplicated] = useState<string | null>(null);

  const filtered = activeCategory === "Всі"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  function handleUse(slug: string) {
    router.push(`${ROUTES.adminEmailCompose}?template=${slug}`);
  }

  function handleDuplicate(slug: string) {
    setDuplicated(slug);
    setTimeout(() => setDuplicated(null), 1800);
  }

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.filterTab} ${activeCategory === cat ? styles.filterTabActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button type="button" className={styles.btnNew}>
          <Plus size={13} />
          Новий шаблон
        </button>
      </div>

      {/* Gallery grid */}
      <div className={styles.grid}>
        {filtered.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.slug} className={styles.card}>
              {/* Preview area */}
              <div className={styles.cardPreview} style={{ background: t.iconBg }}>
                <div className={styles.cardPreviewInner}>
                  <div className={styles.cardPreviewIcon} style={{ color: t.iconColor }}>
                    <Icon size={28} />
                  </div>
                  <div className={styles.cardPreviewLines}>
                    <div className={styles.previewLine} style={{ width: "70%", background: t.iconColor, opacity: 0.4 }} />
                    <div className={styles.previewLine} style={{ width: "90%", opacity: 0.15 }} />
                    <div className={styles.previewLine} style={{ width: "80%", opacity: 0.1 }} />
                    <div className={styles.previewLine} style={{ width: "60%", opacity: 0.1 }} />
                  </div>
                  <div className={styles.cardPreviewBtn} style={{ borderColor: t.iconColor, color: t.iconColor }}>
                    Дія →
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardCategory}>{t.category}</span>
                  <span className={styles.cardUsage}>{t.usageCount} використань</span>
                </div>
                <div className={styles.cardName}>{t.name}</div>
                <div className={styles.cardDesc}>{t.description}</div>
                <div className={styles.cardFields}>
                  {t.fields.map((f) => (
                    <span key={f} className={styles.field}>{f}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.btnUse}
                    onClick={() => handleUse(t.slug)}
                  >
                    Використати
                    <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    className={styles.btnIcon}
                    title="Дублювати"
                    onClick={() => handleDuplicate(t.slug)}
                  >
                    {duplicated === t.slug ? "✓" : <Copy size={13} />}
                  </button>
                  <button
                    type="button"
                    className={styles.btnIcon}
                    title="Редагувати"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
