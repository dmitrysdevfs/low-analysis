"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLaws } from "@/hooks/useLaws";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { LegislatorAccessRequestForm } from "@/features/law-change/components/LegislatorAccessRequestForm/LegislatorAccessRequestForm";
import { MyProposalsList } from "@/features/law-change/components/MyProposalsList/MyProposalsList";
import {
  useMyForks,
  useCreateFork,
  useSubmitFork,
  useAddChange,
} from "@/hooks/useForks";
import { ForkDiffModal } from "@/components/fork/ForkDiffModal";
import { useMyProposals } from "@/features/law-change";
import { fetchMyForks } from "@/lib/api/graph1";
import type { GraphFork } from "@/features/graph1/types/graph1.types";
import styles from "./page.module.scss";

export default function LegislatorCabinetPage() {
  const { isLegislator, isSupervisor, isAdmin } = useAuth();

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <div className={styles.accessWrap}>
        <div className={styles.accessCard}>
          <h2 className={styles.accessTitle}>Кабінет законотворця</h2>
          <LegislatorAccessRequestForm />
        </div>
      </div>
    );
  }

  return (
    <LegislatorWorkspace
      isSupervisor={isSupervisor && !isLegislator && !isAdmin}
    />
  );
}

function LegislatorWorkspace({ isSupervisor }: { isSupervisor: boolean }) {
  const { laws } = useLaws();
  const { data: proposals = [] } = useMyProposals();

  const { data: forks = [], isLoading: forksLoading } = useMyForks();
  const { data: graphForks = [], isLoading: graphForksLoading } = useQuery<
    GraphFork[]
  >({
    queryKey: ["graph1-forks", "my"],
    queryFn: fetchMyForks,
    staleTime: 60_000,
  });
  const createForkMutation = useCreateFork();
  const submitForkMutation = useSubmitFork();
  const addChangeMutation = useAddChange();

  const [showForkForm, setShowForkForm] = useState(false);
  const [forkTitle, setForkTitle] = useState("");
  const [forkLawId, setForkLawId] = useState("");
  const [forkDesc, setForkDesc] = useState("");
  const [diffForkId, setDiffForkId] = useState<string | null>(null);

  const [addChangeForkId, setAddChangeForkId] = useState<string | null>(null);
  const [changeOp, setChangeOp] = useState<"edit" | "add" | "delete">("edit");
  const [changeCode, setChangeCode] = useState("");
  const [changeOriginal, setChangeOriginal] = useState("");
  const [changeProposed, setChangeProposed] = useState("");
  const [changeRationale, setChangeRationale] = useState("");

  const draftForks = forks.filter((f) => f.status === "draft");
  const proposalCount = proposals.length;
  const forkCount = forks.length;

  const handleCreateFork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkTitle.trim() || !forkLawId) {
      notify.warning("Вкажіть назву та закон");
      return;
    }
    try {
      await createForkMutation.mutateAsync({
        lawId: forkLawId,
        title: forkTitle,
        description: forkDesc,
      });
      notify.success("Форк створено");
      setForkTitle("");
      setForkLawId("");
      setForkDesc("");
      setShowForkForm(false);
    } catch {
      notify.error("Не вдалося створити форк");
    }
  };

  const handleAddChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addChangeForkId || !changeCode.trim()) {
      notify.warning("Вкажіть код елемента");
      return;
    }
    try {
      await addChangeMutation.mutateAsync({
        forkId: addChangeForkId,
        change: {
          elementId: changeCode,
          elementCode: changeCode,
          operation: changeOp,
          originalText: changeOriginal,
          proposedText: changeProposed,
          rationale: changeRationale,
        },
      });
      notify.success("Зміну додано");
      setChangeCode("");
      setChangeOriginal("");
      setChangeProposed("");
      setChangeRationale("");
      setAddChangeForkId(null);
    } catch {
      notify.error("Не вдалося додати зміну");
    }
  };

  return (
    <div className={styles.workspace}>
      {/* Main column */}
      <div className={styles.main}>
        {/* Header */}
        <div className={styles.cabinetHeader}>
          <div className={styles.cabinetTitle}>
            <span className={styles.cabinetIcon}>⚖</span>
            <h1>
              {isSupervisor ? "Кабінет супервізора" : "Кабінет законотворця"}
            </h1>
          </div>
          {!isSupervisor && (
            <button
              className={styles.newProposalBtn}
              onClick={() => setShowForkForm(true)}
            >
              + Нова пропозиція
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <StatCard
            icon="📄"
            label="Пропозиції"
            count={proposalCount}
            sub={
              proposalCount === 0
                ? "Немає створених"
                : `${proposalCount} активних`
            }
          />
          <StatCard
            icon="✏️"
            label="Поправки"
            count={0}
            sub="Немає створених"
          />
          <StatCard
            icon="⚡"
            label="Форки"
            count={forkCount}
            sub={
              draftForks.length > 0
                ? `${draftForks.length} активна чернетка`
                : "Немає чернеток"
            }
            highlighted={forkCount > 0}
          />
        </div>

        {/* Мої пропозиції */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <span>📄</span>
              <span>Мої пропозиції</span>
            </div>
            {!isSupervisor && proposalCount === 0 && (
              <span className={styles.sectionEmpty}>
                У вас ще немає створених пропозицій.
              </span>
            )}
            {!isSupervisor && (
              <button className={styles.sectionAddBtn}>
                Створити пропозицію +
              </button>
            )}
          </div>
          {proposalCount > 0 && <MyProposalsList />}
        </section>

        {/* Мої поправки */}
        {!isSupervisor && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <span>✏️</span>
                <span>Мої поправки</span>
              </div>
              <span className={styles.sectionEmpty}>
                Ви ще не створили жодної поправки.
              </span>
              <button className={styles.sectionAddBtn}>
                Створити поправку +
              </button>
            </div>
          </section>
        )}

        {/* Мої форки */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <span>⚡</span>
              <span>Мої форки законопроектів</span>
            </div>
            {!isSupervisor && (
              <button
                className={styles.forkNewBtn}
                onClick={() => setShowForkForm(true)}
              >
                Новий форк +
              </button>
            )}
          </div>

          {showForkForm && (
            <form onSubmit={handleCreateFork} className={styles.forkCreateForm}>
              <select
                value={forkLawId}
                onChange={(e) => setForkLawId(e.target.value)}
                required
              >
                <option value="">Оберіть закон</option>
                {laws?.map((law) => (
                  <option key={law._id} value={law._id}>
                    {law.code} — {law.title?.slice(0, 60)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={forkTitle}
                onChange={(e) => setForkTitle(e.target.value)}
                placeholder="Назва форку"
                required
              />
              <textarea
                value={forkDesc}
                onChange={(e) => setForkDesc(e.target.value)}
                placeholder="Опис (необов'язково)"
                rows={2}
              />
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowForkForm(false)}>
                  Скасувати
                </button>
                <button type="submit" disabled={createForkMutation.isPending}>
                  Створити
                </button>
              </div>
            </form>
          )}

          {forksLoading && (
            <p className={styles.loadingText}>Завантаження...</p>
          )}
          {!forksLoading && forks.length === 0 && (
            <p className={styles.emptyText}>
              Форків ще немає. Натисніть «Новий форк» щоб почати.
            </p>
          )}

          {forks.map((fork) => {
            const law = typeof fork.lawId === "object" ? fork.lawId : null;
            const isEditing = addChangeForkId === fork._id;
            return (
              <div key={fork._id} className={styles.forkBlock}>
                <div className={styles.forkCard}>
                  <div className={styles.forkMeta}>
                    <div>
                      <div className={styles.forkNumber}>
                        {law?.code ?? "—"}
                      </div>
                      <div className={styles.forkMetaLabel}>Реєстр. №</div>
                    </div>
                    <div>
                      <div className={styles.forkNumber}>
                        {forks.indexOf(fork) + 1}
                      </div>
                      <div className={styles.forkMetaLabel}>
                        № законопроекту
                      </div>
                    </div>
                  </div>
                  <div className={styles.forkInfo}>
                    <div className={styles.forkTitleText}>{fork.title}</div>
                    <div
                      className={styles.forkStatusBadge}
                      data-status={fork.status}
                    >
                      {fork.status}
                    </div>
                  </div>
                  <div className={styles.forkActions}>
                    <button
                      className={styles.forkActionBtn}
                      onClick={() => setDiffForkId(fork._id)}
                    >
                      👁 Переглянути зміни
                    </button>
                    {fork.status === "draft" && (
                      <button
                        className={`${styles.forkActionBtn} ${styles.forkSubmitBtn}`}
                        onClick={() =>
                          submitForkMutation.mutate(fork._id, {
                            onSuccess: () =>
                              notify.success("Форк подано на розгляд"),
                            onError: () => notify.error("Помилка"),
                          })
                        }
                      >
                        ✈ Подати на розгляд
                      </button>
                    )}
                  </div>
                </div>

                {fork.status === "draft" && (
                  <div className={styles.editorBlock}>
                    <div className={styles.editorHeader}>
                      <span className={styles.editorTitle}>Редактор змін</span>
                    </div>
                    {!isEditing ? (
                      <button
                        className={styles.addChangeBtn}
                        onClick={() => setAddChangeForkId(fork._id)}
                      >
                        + Зміна
                      </button>
                    ) : (
                      <form
                        onSubmit={handleAddChange}
                        className={styles.changeForm}
                      >
                        <div className={styles.changeFormRow}>
                          <select
                            value={changeOp}
                            onChange={(e) =>
                              setChangeOp(
                                e.target.value as "edit" | "add" | "delete",
                              )
                            }
                            className={styles.changeSelect}
                          >
                            <option value="edit">Редагувати</option>
                            <option value="add">Додати</option>
                            <option value="delete">Видалити</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Код елементу (напр. ст.1, ч.1)"
                            value={changeCode}
                            onChange={(e) => setChangeCode(e.target.value)}
                            className={styles.changeInput}
                            required
                          />
                          <button type="button" className={styles.saveDraftBtn}>
                            Зберегти чернетку
                          </button>
                          <button type="button" className={styles.moreBtn}>
                            ···
                          </button>
                        </div>
                        {changeOp !== "add" && (
                          <div className={styles.changeFieldRow}>
                            <label className={styles.changeLabel}>
                              Оригінальний текст
                            </label>
                            <textarea
                              value={changeOriginal}
                              onChange={(e) =>
                                setChangeOriginal(e.target.value)
                              }
                              rows={3}
                              className={styles.changeTextarea}
                            />
                          </div>
                        )}
                        {changeOp !== "delete" && (
                          <div className={styles.changeFieldRow}>
                            <label className={styles.changeLabel}>
                              Пропонований текст
                            </label>
                            <textarea
                              value={changeProposed}
                              onChange={(e) =>
                                setChangeProposed(e.target.value)
                              }
                              rows={3}
                              className={styles.changeTextarea}
                            />
                          </div>
                        )}
                        <div className={styles.changeFieldRow}>
                          <label className={styles.changeLabel}>
                            Обґрунтування
                          </label>
                          <textarea
                            value={changeRationale}
                            onChange={(e) => setChangeRationale(e.target.value)}
                            rows={2}
                            className={styles.changeTextarea}
                          />
                        </div>
                        <div className={styles.changeFormActions}>
                          <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => setAddChangeForkId(null)}
                          >
                            Скасувати
                          </button>
                          <button
                            type="submit"
                            className={styles.saveChangeBtn}
                            disabled={addChangeMutation.isPending}
                          >
                            Зберегти зміну
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Мої форки графу зв'язків */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <span>🕸</span>
              <span>Мої форки графу зв&apos;язків</span>
            </div>
            <a
              href="/graph"
              className={styles.sectionAddBtn}
              style={{ textDecoration: "none" }}
            >
              Відкрити граф +
            </a>
          </div>

          {graphForksLoading && (
            <p className={styles.loadingText}>Завантаження...</p>
          )}
          {!graphForksLoading && graphForks.length === 0 && (
            <p className={styles.emptyText}>
              Немає збережених форків графу. Перейдіть до графу та збережіть
              стан.
            </p>
          )}
          {graphForks.map((gf) => (
            <div key={gf._id} className={styles.forkBlock}>
              <div className={styles.forkCard}>
                <div className={styles.forkInfo}>
                  <div className={styles.forkTitleText}>{gf.name}</div>
                  {gf.description && (
                    <div className={styles.forkMetaLabel}>{gf.description}</div>
                  )}
                  <div className={styles.forkMetaLabel}>
                    {new Date(gf.updatedAt).toLocaleDateString("uk-UA")}
                  </div>
                </div>
                <div className={styles.forkActions}>
                  <button
                    className={styles.forkActionBtn}
                    onClick={() =>
                      window.open(`/graph?fork=${gf._id}`, "_blank")
                    }
                  >
                    🕸 Відкрити граф
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {/* Process status */}
        <div className={styles.sidePanel}>
          <h3 className={styles.sidePanelTitle}>
            <span className={styles.sidePanelIcon}>✓</span>
            Статус процесу
          </h3>
          <div className={styles.processSteps}>
            {[
              { label: "Чернетка", sub: "Ви редагуєте зміни", active: true },
              {
                label: "Перевірка",
                sub: "Юридична і технічна перевірка",
                active: false,
              },
              { label: "Подання", sub: "Подання на розгляд", active: false },
              {
                label: "Розгляд",
                sub: "Розгляд у відповідному комітеті",
                active: false,
              },
            ].map((step) => (
              <div
                key={step.label}
                className={`${styles.processStep} ${step.active ? styles.processStepActive : ""}`}
              >
                <div className={styles.processStepDot} />
                <div>
                  <div className={styles.processStepLabel}>{step.label}</div>
                  <div className={styles.processStepSub}>{step.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className={styles.sidePanel}>
          <h3 className={styles.sidePanelTitle}>
            <span className={styles.sidePanelIcon}>💡</span>
            Поради для юриста
          </h3>
          <div className={styles.tips}>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>📎</span>
              <div>
                <div className={styles.tipTitle}>
                  Точно посилайтеся на норму
                </div>
                <div className={styles.tipText}>
                  Вказуйте статтю, частину, пункт для чіткої ідентифікації змін.
                </div>
              </div>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>❓</span>
              <div>
                <div className={styles.tipTitle}>
                  Надавайте правове обґрунтування
                </div>
                <div className={styles.tipText}>
                  Поясніть мету змін та очікуваний правовий ефект.
                </div>
              </div>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>📋</span>
              <div>
                <div className={styles.tipTitle}>Зіставляйте тексти</div>
                <div className={styles.tipText}>
                  Порівняйте оригінальний та пропонований текст для ясності.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className={styles.sidePanel}>
          <h3 className={styles.sidePanelTitle}>
            <span className={styles.sidePanelIcon}>⚡</span>
            Швидкі дії
          </h3>
          <div className={styles.quickActions}>
            {[
              { label: "Експорт", icon: "📥" },
              { label: "Історія змін", icon: "🕐" },
              { label: "Шаблони", icon: "📄" },
            ].map((action) => (
              <button key={action.label} className={styles.quickAction}>
                <span className={styles.quickActionIcon}>{action.icon}</span>
                <span>{action.label}</span>
                <span className={styles.quickActionArrow}>›</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {diffForkId && (
        <ForkDiffModal
          forkId={diffForkId}
          onClose={() => setDiffForkId(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  count,
  sub,
  highlighted = false,
}: {
  icon: string;
  label: string;
  count: number;
  sub: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`${styles.statCard} ${highlighted ? styles.statCardHighlighted : ""}`}
    >
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statCount}>{count}</div>
        <div className={styles.statSub}>{sub}</div>
      </div>
    </div>
  );
}
