"use client";

import styles from "../PageBuilder.module.scss";

export interface PageSettings {
  name: string;
  slug: string;
  template: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  showInMenu: boolean;
  showInFooter: boolean;
  indexable: boolean;
}

interface Props {
  settings: PageSettings;
  onChange: (next: PageSettings) => void;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

export function PageSettingsPanel({ settings, onChange }: Props) {
  const set = <K extends keyof PageSettings>(key: K, value: PageSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className={styles.pageSettings}>
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>ОСНОВНІ</div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>Назва сторінки</label>
          <input
            className={styles.settingsInput}
            value={settings.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Введіть назву..."
          />
        </div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>URL (slug)</label>
          <div className={styles.settingsSlugWrap}>
            <span className={styles.settingsSlugPrefix}>/</span>
            <input
              className={styles.settingsInput}
              value={settings.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>Шаблон</label>
          <select
            className={styles.settingsSelect}
            value={settings.template}
            onChange={(e) => set("template", e.target.value)}
          >
            <option value="basic">Базовий</option>
            <option value="landing">Landing</option>
            <option value="docs">Документація</option>
          </select>
        </div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>Статус</label>
          <select
            className={styles.settingsSelect}
            value={settings.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="draft">Чернетка</option>
            <option value="published">Опубліковано</option>
          </select>
        </div>
      </div>

      <div className={styles.settingsSep} />

      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>SEO</div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>Meta title</label>
          <input
            className={styles.settingsInput}
            value={settings.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            placeholder="Law Analysis — Юридична аналітика"
          />
        </div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>Meta description</label>
          <textarea
            className={styles.settingsTextarea}
            rows={3}
            value={settings.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            placeholder="Аналітична платформа для юристів та компаній..."
          />
        </div>

        <div className={styles.settingsField}>
          <label className={styles.settingsLabel}>Ключові слова</label>
          <input
            className={styles.settingsInput}
            value={settings.keywords}
            onChange={(e) => set("keywords", e.target.value)}
            placeholder="юридична аналітика, право, дані, інсайти"
          />
        </div>
      </div>

      <div className={styles.settingsSep} />

      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}>НАЛАШТУВАННЯ</div>

        <div className={styles.settingsToggleRow}>
          <span className={styles.settingsToggleLabel}>Показати в меню</span>
          <Toggle checked={settings.showInMenu} onChange={(v) => set("showInMenu", v)} />
        </div>
        <div className={styles.settingsToggleRow}>
          <span className={styles.settingsToggleLabel}>Показати в футері</span>
          <Toggle checked={settings.showInFooter} onChange={(v) => set("showInFooter", v)} />
        </div>
        <div className={styles.settingsToggleRow}>
          <span className={styles.settingsToggleLabel}>Індексувати сторінку</span>
          <Toggle checked={settings.indexable} onChange={(v) => set("indexable", v)} />
        </div>
      </div>
    </div>
  );
}
