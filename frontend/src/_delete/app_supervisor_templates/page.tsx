"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  FilePlus2,
  PencilLine,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  RoleAccessGate,
  RoleHydrationShell,
  RoleWorkspace,
  formatUkDate,
} from "@/features/role-workspace/roleWorkspace";
import shellStyles from "@/features/role-workspace/roleWorkspace.module.scss";
import styles from "./page.module.scss";

type TemplateType = "edit" | "add" | "delete";

type TemplateCard = {
  id: string;
  name: string;
  type: TemplateType;
  law: string;
  description: string;
  text: string;
  createdAt: string;
  author?: string;
  uses?: number;
};

type TemplateFormState = {
  name: string;
  type: TemplateType;
  law: string;
  text: string;
  description: string;
};

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  edit: "Edit",
  add: "Add",
  delete: "Delete",
};

const INITIAL_MY_TEMPLATES: TemplateCard[] = [
  {
    id: "sv-t-1",
    name: "Уточнення термінів",
    type: "edit",
    law: "Про запобігання корупції",
    description: "Шаблон для правок формулювань у визначеннях та прикінцевих положеннях.",
    text: "Пропонується викласти абзац у такій редакції...",
    createdAt: "2026-06-18T09:00:00.000Z",
  },
  {
    id: "sv-t-2",
    name: "Додавання винятків",
    type: "add",
    law: "Бюджетний кодекс України",
    description: "Застосовується для додавання окремого пункту з чіткими умовами винятку.",
    text: "Доповнити статтю новим пунктом такого змісту...",
    createdAt: "2026-06-16T14:00:00.000Z",
  },
  {
    id: "sv-t-3",
    name: "Видалення дублювань",
    type: "delete",
    law: "Про Національну поліцію",
    description: "Шаблон для зняття повторюваних абзаців із посиланням на чинну редакцію.",
    text: "Виключити абзац другий частини третьої...",
    createdAt: "2026-06-12T11:20:00.000Z",
  },
];

const PUBLIC_TEMPLATES: TemplateCard[] = [
  {
    id: "sv-p-1",
    name: "Базова поправка до статті",
    type: "edit",
    law: "Універсальний",
    description: "Публічний каркас для переписування статті з аргументацією та посиланням на джерела.",
    text: "Статтю викласти у такій редакції...",
    createdAt: "2026-06-10T09:00:00.000Z",
    author: "Legal Lab",
    uses: 42,
  },
  {
    id: "sv-p-2",
    name: "Нове положення",
    type: "add",
    law: "Універсальний",
    description: "Структура для додавання окремого пункту або нової статті зі змістом і метою.",
    text: "Доповнити закон новою статтею такого змісту...",
    createdAt: "2026-06-09T12:10:00.000Z",
    author: "Law Analysis",
    uses: 31,
  },
  {
    id: "sv-p-3",
    name: "Скасування норми",
    type: "delete",
    law: "Універсальний",
    description: "Використовується для вилучення неактуального або конфліктного положення.",
    text: "Положення пункту визнати таким, що втратив чинність...",
    createdAt: "2026-06-05T16:40:00.000Z",
    author: "Mentor Board",
    uses: 19,
  },
];

const EMPTY_FORM: TemplateFormState = {
  name: "",
  type: "edit",
  law: "",
  text: "",
  description: "",
};

export default function SupervisorTemplatesPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();
  const [myTemplates, setMyTemplates] = useState(INITIAL_MY_TEMPLATES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>(EMPTY_FORM);

  const libraryStats = useMemo(
    () => ({
      privateCount: myTemplates.length,
      publicCount: PUBLIC_TEMPLATES.length,
    }),
    [myTemplates.length],
  );

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormState(EMPTY_FORM);
  }

  function openCreateModal() {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(template: TemplateCard) {
    setEditingId(template.id);
    setFormState({
      name: template.name,
      type: template.type,
      law: template.law,
      text: template.text,
      description: template.description,
    });
    setIsModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId) {
      setMyTemplates((current) =>
        current.map((template) =>
          template.id === editingId
            ? {
                ...template,
                ...formState,
              }
            : template,
        ),
      );
    } else {
      setMyTemplates((current) => [
        {
          id: `sv-template-${Date.now()}`,
          ...formState,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }

    closeModal();
  }

  function copyPublicTemplate(template: TemplateCard) {
    setMyTemplates((current) => [
      {
        ...template,
        id: `copy-${template.id}-${Date.now()}`,
        name: `${template.name} · копія`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }

  if (!isHydrated) {
    return <RoleHydrationShell />;
  }

  if (!isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="SUPERVISOR ACCESS"
        title="Бібліотека шаблонів доступна лише для ролі Supervisor"
        text="У цьому розділі супервайзер керує власними шаблонами поправок та ділиться ними зі своїми групами."
        primaryHref={ROUTES.rolesSupervisor}
        primaryLabel="Про роль Supervisor"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "SV").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? "Адміністратор" : "Супервайзер";

  return (
    <RoleWorkspace
      role="supervisor"
      initials={initials}
      name={user?.displayName ?? "Supervisor"}
      roleLabel={roleLabel}
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>SUPERVISOR · ШАБЛОНИ</span>
              <h1 className={shellStyles.pageTitle}>Бібліотека шаблонів</h1>
              <p className={shellStyles.pageSubtitle}>
                Готуйте типові поправки, редагуйте їх перед заняттями й діліться
                готовими шаблонами з групами без дублювання роботи.
              </p>
            </div>
            <div className={shellStyles.toolbar}>
              <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={14} />
                Створити шаблон
              </button>
            </div>
          </div>
        </section>

        <section className={shellStyles.kpiGrid}>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Мої шаблони</p>
            <h2 className={shellStyles.kpiValue}>{libraryStats.privateCount}</h2>
            <p className={shellStyles.kpiNote}>Персональні заготовки для груп.</p>
          </article>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Публічні</p>
            <h2 className={shellStyles.kpiValue}>{libraryStats.publicCount}</h2>
            <p className={shellStyles.kpiNote}>Базова спільна бібліотека.</p>
          </article>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Використання</p>
            <h2 className={shellStyles.kpiValue}>92</h2>
            <p className={shellStyles.kpiNote}>Сумарні використання шаблонів.</p>
          </article>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Стан</p>
            <h2 className={shellStyles.kpiValue}>
              <Sparkles size={24} />
            </h2>
            <p className={shellStyles.kpiNote}>Готово до розшарення з групами.</p>
          </article>
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={shellStyles.eyebrow}>Мої шаблони</span>
              <h2 className={styles.sectionTitle}>Швидкі заготовки для груп</h2>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {myTemplates.map((template) => (
              <article key={template.id} className={styles.templateCard}>
                <div className={styles.cardTop}>
                  <span
                    className={`${shellStyles.badge} ${styles[`badge_${template.type}`]}`}
                  >
                    {TEMPLATE_TYPE_LABELS[template.type]}
                  </span>
                  <span className={styles.cardDate}>{formatUkDate(template.createdAt)}</span>
                </div>
                <h3 className={styles.cardTitle}>{template.name}</h3>
                <p className={styles.cardLaw}>{template.law}</p>
                <p className={styles.cardDescription}>{template.description}</p>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => openEditModal(template)}
                  >
                    <PencilLine size={14} />
                    Редагувати
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => console.log("share with group", template.id)}
                  >
                    <Share2 size={14} />
                    Поділитись з групою
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={shellStyles.eyebrow}>Публічні шаблони</span>
              <h2 className={styles.sectionTitle}>Read-only бібліотека</h2>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {PUBLIC_TEMPLATES.map((template) => (
              <article key={template.id} className={styles.templateCard}>
                <div className={styles.cardTop}>
                  <span
                    className={`${shellStyles.badge} ${styles[`badge_${template.type}`]}`}
                  >
                    {TEMPLATE_TYPE_LABELS[template.type]}
                  </span>
                  <span className={styles.cardUses}>{template.uses} використань</span>
                </div>
                <h3 className={styles.cardTitle}>{template.name}</h3>
                <p className={styles.cardLaw}>{template.author}</p>
                <p className={styles.cardDescription}>{template.description}</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => copyPublicTemplate(template)}
                >
                  <Copy size={14} />
                  Використати
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className={shellStyles.modalBackdrop} onClick={closeModal}>
          <div
            className={shellStyles.modalCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={shellStyles.modalHeader}>
              <span className={shellStyles.eyebrow}>
                {editingId ? "Редагування" : "Новий шаблон"}
              </span>
              <h2 className={shellStyles.modalTitle}>Створити шаблон</h2>
              <p className={shellStyles.modalSubtitle}>
                Задайте структуру поправки, привʼязаний закон і текст, який потім
                можна буде використати або поширити в групі.
              </p>
            </div>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <label className={shellStyles.field}>
                <span className={shellStyles.fieldLabel}>Назва</span>
                <input
                  className={shellStyles.input}
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Наприклад, Уточнення визначення"
                  required
                />
              </label>

              <div className={styles.formGrid}>
                <label className={shellStyles.field}>
                  <span className={shellStyles.fieldLabel}>Тип</span>
                  <select
                    className={shellStyles.select}
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        type: event.target.value as TemplateType,
                      }))
                    }
                  >
                    <option value="edit">Edit</option>
                    <option value="add">Add</option>
                    <option value="delete">Delete</option>
                  </select>
                </label>

                <label className={shellStyles.field}>
                  <span className={shellStyles.fieldLabel}>Прив&apos;язаний закон</span>
                  <input
                    className={shellStyles.input}
                    value={formState.law}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        law: event.target.value,
                      }))
                    }
                    placeholder="Назва закону або код"
                    required
                  />
                </label>
              </div>

              <label className={shellStyles.field}>
                <span className={shellStyles.fieldLabel}>Текст шаблону</span>
                <textarea
                  className={shellStyles.textarea}
                  value={formState.text}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  placeholder="Викласти статтю у такій редакції..."
                  required
                />
              </label>

              <label className={shellStyles.field}>
                <span className={shellStyles.fieldLabel}>Опис</span>
                <input
                  className={shellStyles.input}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Коротко поясніть сценарій використання"
                  required
                />
              </label>

              <div className={shellStyles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  <FilePlus2 size={14} />
                  {editingId ? "Оновити" : "Створити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleWorkspace>
  );
}
