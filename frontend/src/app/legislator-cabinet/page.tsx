"use client";

import { useState } from "react";
import { useProposals, useCreateProposal } from "@/hooks/useProposals";
import { useAmendments } from "@/hooks/useAmendments";
import { useLaws } from "@/hooks/useLaws";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { DiffViewer } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { LegislatorCabinetSection } from "@/features/law-change/LegislatorCabinetSection";
import styles from "./page.module.scss";

export default function LegislatorCabinetPage() {
  const { user, isLegislator } = useAuth();
  const { data: proposals, isLoading: proposalsLoading } = useProposals();
  const { data: amendments, isLoading: amendmentsLoading } = useAmendments({
    userId: user?.id,
  });
  const { laws } = useLaws();

  const createProposalMutation = useCreateProposal();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lawId, setLawId] = useState("");

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lawId) return;

    await createProposalMutation.mutateAsync({
      title,
      description,
      law_id: lawId,
    });

    setTitle("");
    setDescription("");
    setLawId("");
    setShowCreateForm(false);
  };

  if (proposalsLoading || amendmentsLoading) {
    return <div className={styles.container}>Завантаження...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Кабінет законотворця</h1>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className={styles.createBtn}
          >
            + Нова пропозиція
          </button>
        )}
      </header>

      {showCreateForm && (
        <section className={styles.formSection}>
          <h2>Створити нову пропозицію (законопроєкт)</h2>
          <form onSubmit={handleCreateProposal} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Назва пропозиції:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Наприклад: Зміни до статті 10 щодо..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Опис:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Опишіть суть вашого законопроєкту..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Виберіть закон:</label>
              <select
                value={lawId}
                onChange={(e) => setLawId(e.target.value)}
                required
              >
                <option value="">-- Оберіть закон --</option>
                {laws?.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowCreateForm(false)}>
                Скасувати
              </button>
              <button type="submit" disabled={createProposalMutation.isPending}>
                Зберегти
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.section}>
        <h2>Мої пропозиції</h2>
        <div className={styles.grid}>
          {proposals?.map((proposal) => (
            <Link
              key={proposal._id}
              href={ROUTES.legislatorProposal(proposal._id)}
              className={styles.card}
            >
              <div>
                <h3>{proposal.title}</h3>
                <p>{proposal.description || "Без опису"}</p>
              </div>
              <div className={styles.footer}>
                <span className={styles.status}>{proposal.status}</span>
                <span className={styles.count}>
                  {proposal.amendments_count || 0} поправок
                </span>
              </div>
            </Link>
          ))}
          {proposals?.length === 0 && (
            <p className={styles.noItems}>
              У вас ще немає створених пропозицій.
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Мої поправки</h2>
        <div className={styles.amendmentsGrid}>
          {amendments?.map((amendment) => (
            <div key={amendment._id} className={styles.amendmentCard}>
              <div className={styles.amendmentMeta}>
                <span className={styles.amendmentContext}>
                  {amendment.context?.article_num
                    ? `Стаття ${amendment.context.article_num} · `
                    : ""}
                  {amendment.context?.element_code}
                </span>
                <span className={styles.amendmentProposal}>
                  {amendment.proposal_id ? (
                    <Link
                      href={ROUTES.legislatorProposal(amendment.proposal_id)}
                      style={{ color: "inherit", textDecoration: "underline" }}
                    >
                      Прив’язано до пропозиції
                    </Link>
                  ) : (
                    "Не прив’язано до пропозиції"
                  )}
                </span>
              </div>
              <div className={styles.amendmentDiff}>
                <strong>Зміни:</strong>
                <DiffViewer
                  original={amendment.original_text}
                  proposed={amendment.proposed_text}
                />
              </div>
              {amendment.reason && (
                <div
                  className={styles.amendmentReason}
                  style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}
                >
                  <strong>Обґрунтування:</strong> <em>{amendment.reason}</em>
                </div>
              )}
            </div>
          ))}
          {amendments?.length === 0 && (
            <p className={styles.noItems}>Ви ще не створили жодної поправки.</p>
          )}
        </div>
      </section>

      <LegislatorCabinetSection isLegislator={isLegislator} />
    </div>
  );
}
