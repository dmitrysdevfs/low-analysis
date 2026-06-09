"use client";

import styles from "./page.module.scss";

const TEMPLATES = [
  {
    slug: "broadcast",
    name: "Широкомовлення",
    description: "Загальні оголошення для всіх або частини аудиторії",
    fields: ["Заголовок", "Текст", "Кнопка CTA (опціонально)"],
  },
  {
    slug: "maintenance",
    name: "Технічне обслуговування",
    description: "Сповіщення про заплановані роботи або збої",
    fields: [
      "Заголовок",
      "Текст",
      "Час початку",
      "Час завершення",
      "Кнопка CTA (опціонально)",
    ],
  },
  {
    slug: "product-update",
    name: "Оновлення продукту",
    description: "Релізні нотатки та анонс нових функцій",
    fields: [
      "Заголовок",
      "Текст",
      "Список функцій",
      "Кнопка CTA (опціонально)",
    ],
  },
];

export default function AdminEmailTemplatesPage() {
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {TEMPLATES.map((t) => (
          <div key={t.slug} className={styles.card}>
            <div className={styles.cardSlug}>{t.slug}</div>
            <div className={styles.cardName}>{t.name}</div>
            <div className={styles.cardDesc}>{t.description}</div>
            <div className={styles.cardFields}>
              {t.fields.map((f) => (
                <span key={f} className={styles.field}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
