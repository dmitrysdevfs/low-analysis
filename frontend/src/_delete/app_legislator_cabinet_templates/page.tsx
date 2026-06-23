"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  FilePlus2,
  LayoutGrid,
  PencilLine,
  Plus,
  Trash2,
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
type TemplateTab = "public" | "mine" | "saved";

type TemplateCard = {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  text: string;
  law: string;
  author?: string;
  createdAt: string;
};

type TemplateFormState = {
  name: string;
  type: TemplateType;
  law: string;
  text: string;
  description: string;
};

const TEMPLATE_TYPES: Record<TemplateType, string> = {
  edit: "Edit",
  add: "Add",
  delete: "Delete",
};

const TABS: { key: TemplateTab; label: string }[] = [
  { key: "public", label: "Публічні" },
  { key: "mine", label: "Мої шаблони" },
  { key: "saved", label: "Збережені" },
];

const INITIAL_PUBLIC: TemplateCard[] = [
  {
    id: "lg-public-1",
    name: "Аргументована редакція",
    type: "edit",
    description:
      "Публічний шаблон для переписування норми з коротким поясненням і джерелами.",
    text: "Пропонується викласти норму у такій редакції...",
    law: "Універсальний",
    author: "Law Analysis",
    createdAt: "2026-06-18T09:00:00.000Z",
  },
  {
    id: "lg-public-2",
    name: "Новий пункт",
    type: "add",
    description:
      "Каркас для додавання нового пункту, статті або перехідного положення.",
    text: "Доповнити закон пунктом такого змісту...",
    law: "Універсальний",
    author: "Legal Lab",
    createdAt: "2026-06-15T08:20:00.000Z",
  },
  {
    id: "lg-public-3",
    name: "Скасування дублюючої норми",
    type: "delete",
    description:
      "Застосовується для вилучення повторів або конфліктних фрагментів.",
    text: "Положення статті виключити...",
    law: "Універсальний",
    author: "Mentor Board",
    createdAt: "2026-06-12T14:10:00.000Z",
  },
];

const INITIAL_MY_TEMPLATES: TemplateCard[] = [
  {
    id: "lg-mine-1",
    name: "Моя поправка до дефініцій",
    type: "edit",
    description: "Робочий шаблон для правок у термінах та визначеннях.",
    text: "У статті термін викласти в такій редакції...",
    law: "Про запобігання корупції",
    createdAt: "2026-06-19T11:00:00.000Z",
  },
  {
    id: "lg-mine-2",
    name: "Додати новий абзац",
    type: "add",
    description: "Заготовка для внесення нового абзацу до перехідних положень.",
    text: "Доповнити розділ абзацом такого змісту...",
    law: "Про Національну поліцію",
    createdAt: "2026-06-17T13:00:00.000Z",
  },
  {
    id: "lg-mine-3",
    name: "Вилучити зайве дублювання",
    type: "delete",
    description: "Шаблон для стислого вилучення зайвих повторів.",
    text: "Абзац другий частини третьої виключити...",
    law: "Бюджетний кодекс України",
    createdAt: "2026-06-14T09:30:00.000Z",
  },
];

const INITIAL_SAVED: TemplateCard[] = [
  {
    id: "lg-saved-1",
    name: "Збережений базовий шаблон",
    type: "edit",
    description: "Під рукою для майбутніх правок у спільних групових пакетах.",
    text: "Викласти пункт у такій редакції...",
    law: "Універсальний",
    author: "Law Analysis",
    createdAt: "2026-06-11T08:40:00.000Z",
  },
  {
    id: "lg-saved-2",
    name: "Збережене доповнення",
    type: "add",
    description:
      "Швидка заготовка на випадок, коли треба додати окремий блок норм.",
    text: "Доповнити статтю положенням такого змісту...",
    law: "Універсальний",
    author: "Legal Lab",
    createdAt: "2026-06-10T16:00:00.000Z",
  },
  {
    id: "lg-saved-3",
    name: "Збережене вилучення",
    type: "delete",
    description: "Шаблон для точкового скасування застарілої норми.",
    text: "Підпункт визнати таким, що втратив чинність...",
    law: "Універсальний",
    author: "Mentor Board",
    createdAt: "2026-06-09T10:10:00.000Z",
  },
];

const EMPTY_FORM: TemplateFormState = {
  name: "",
  type: "edit",
  law: "",
  text: "",
  description: "",
};

export default function LegislatorTemplatesPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();
  const [activeTab, setActiveTab] = useState<TemplateTab>("public");
  const [publicTemplates] = useState(INITIAL_PUBLIC);
  const [myTemplates, setMyTemplates] = useState(INITIAL_MY_TEMPLATES);
  const [savedTemplates, setSavedTemplates] = useState(INITIAL_SAVED);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>(EMPTY_FORM);

  const currentCards = useMemo(() => {
    if (activeTab === "mine") {
      return myTemplates;
    }

    if (activeTab === "saved") {
      return savedTemplates;
    }

    return publicTemplates;
  }, [activeTab, myTemplates, publicTemplates, savedTemplates]);

  function closeModal() {
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setIsModalOpen(false);
  }

  function openNewModal() {
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
    setActiveTab("mine");
    setIsModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId) {
      setMyTemplates((current) =>
        current.map((template) =>
          template.id === editingId ? { ...template, ...formState } : template,
        ),
      );
    } else {
      setMyTemplates((current) => [
        {
          id: `leg-template-${Date.now()}`,
          ...formState,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setActiveTab("mine");
    }

    closeModal();
  }

  function saveTemplate(template: TemplateCard) {
    setSavedTemplates((current) => {
      if (current.some((item) => item.name === template.name)) {
        return current;
      }
      return [
        {
          ...template,
          id: `saved-${template.id}`,
        },
        ...current,
      ];
    });
  }

  function removeSavedTemplate(templateId: string) {
    setSavedTemplates((current) =>
      current.filter((item) => item.id !== templateId),
    );
  }

  function deleteMyTemplate(templateId: string) {
    setMyTemplates((current) =>
      current.filter((item) => item.id !== templateId),
    );
  }

  if (!isHydrated) {
    return <RoleHydrationShell />;
  }

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="LAWMAKER ACCESS"
        title="Шаблони поправок доступні лише для ролі Lawmaker"
        text="У цьому просторі зібрані публічні, власні та збережені шаблони, які допомагають швидше готувати пропозиції та форки."
        primaryHref={ROUTES.rolesLawmaker}
        primaryLabel="Про роль Lawmaker"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "LM").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Адміністратор"
    : isSupervisor && !isLegislator
      ? "Супервайзер"
      : "Законотворець";

  return (
    <RoleWorkspace
      role="legislator"
      initials={initials}
      name={user?.displayName ?? "Законотворець"}
      roleLabel={roleLabel}
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>
                ЗАКОНОТВОРЕЦЬ · ШАБЛОНИ
              </span>
              <h1 className={shellStyles.pageTitle}>Шаблони поправок</h1>
              <p className={shellStyles.pageSubtitle}>
                Працюйте з публічними заготовками, збирайте власну бібліотеку та
                тримайте під рукою збережені шаблони для швидкого старту.
              </p>
            </div>
            <div className={shellStyles.toolbar}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openNewModal}
              >
                <Plus size={14} />
                Новий шаблон
              </button>
            </div>
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.tabsPanel}`}>
          <div className={styles.tabRow}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.sectionPanel}`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={shellStyles.eyebrow}>
                {activeTab === "public"
                  ? "Публічні"
                  : activeTab === "mine"
                    ? "Мої шаблони"
                    : "Збережені"}
              </span>
              <h2 className={styles.sectionTitle}>
                {activeTab === "public"
                  ? "Шаблони спільноти"
                  : activeTab === "mine"
                    ? "Моя бібліотека"
                    : "Збережені заготовки"}
              </h2>
            </div>
          </div>

          <div className={styles.cardGrid}>
            {currentCards.map((template) => (
              <article key={template.id} className={styles.templateCard}>
                <div className={styles.cardTop}>
                  <span
                    className={`${shellStyles.badge} ${styles[`badge_${template.type}`]}`}
                  >
                    {TEMPLATE_TYPES[template.type]}
                  </span>
                  <span className={styles.cardDate}>
                    {formatUkDate(template.createdAt)}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{template.name}</h3>
                <p className={styles.cardMeta}>
                  {template.author ? `${template.author} · ` : ""}
                  {template.law}
                </p>
                <p className={styles.cardDescription}>{template.description}</p>

                <div className={styles.cardActions}>
                  {activeTab === "public" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          console.log("use public template", template.id)
                        }
                      >
                        <LayoutGrid size={14} />
                        Використати
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => saveTemplate(template)}
                      >
                        <Bookmark size={14} />
                        Зберегти
                      </button>
                    </>
                  )}

                  {activeTab === "mine" && (
                    <>
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
                        onClick={() => deleteMyTemplate(template.id)}
                      >
                        <Trash2 size={14} />
                        Видалити
                      </button>
                    </>
                  )}

                  {activeTab === "saved" && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => removeSavedTemplate(template.id)}
                    >
                      <Trash2 size={14} />
                      Прибрати зі збережених
                    </button>
                  )}
                </div>
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
              <h2 className={shellStyles.modalTitle}>Новий шаблон</h2>
              <p className={shellStyles.modalSubtitle}>
                Створіть власну заготовку для поправки, яку можна буде швидко
                повторно використати в роботі над законами та форками.
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
                  <span className={shellStyles.fieldLabel}>
                    Прив&apos;язаний закон
                  </span>
                  <input
                    className={shellStyles.input}
                    value={formState.law}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        law: event.target.value,
                      }))
                    }
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
                  required
                />
              </label>

              <div className={shellStyles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                >
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
