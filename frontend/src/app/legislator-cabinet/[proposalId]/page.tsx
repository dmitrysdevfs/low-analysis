"use client";

import { useParams } from "next/navigation";
import { useProposal, useSubmitProposal } from "@/hooks/useProposals";
import { DiffViewer } from "@/components/ui";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

export default function ProposalDetailPage() {
  const { proposalId } = useParams() as { proposalId: string };
  const { data: proposal, isLoading } = useProposal(proposalId);
  const submitMutation = useSubmitProposal();

  if (isLoading) return <div>Завантаження...</div>;
  if (!proposal) return <div>Пропозицію не знайдено</div>;

  return (
    <div className={styles.container}>
      <Link href={ROUTES.legislatorCabinet} className={styles.backLink}>
        ← Назад до кабінету
      </Link>
      <header className={styles.header}>
        <h1>{proposal.title}</h1>
        <div className={styles.meta}>
          <span className={styles.status}>{proposal.status}</span>
          {proposal.status === "draft" && (
            <button
              onClick={() => submitMutation.mutate(proposalId)}
              disabled={submitMutation.isPending}
              className={styles.submitBtn}
            >
              Відправити на розгляд
            </button>
          )}
        </div>
      </header>

      <section className={styles.content}>
        <p>{proposal.description}</p>

        <h2>Поправки ({proposal.amendments?.length || 0})</h2>
        <div className={styles.amendments}>
          {proposal.amendments?.map((amendment) => (
            <div key={amendment._id} className={styles.amendmentCard}>
              <div className={styles.context}>
                {amendment.context.article_num &&
                  `Стаття ${amendment.context.article_num}. `}
                {amendment.context.element_code}
              </div>
              <div className={styles.diff} style={{ display: "block" }}>
                <strong>Зміни:</strong>
                <DiffViewer
                  original={amendment.original_text}
                  proposed={amendment.proposed_text}
                />
              </div>
              {amendment.reason && (
                <div
                  className={styles.reason}
                  style={{ whiteSpace: "pre-wrap", marginTop: "12px" }}
                >
                  <strong>Обґрунтування:</strong>
                  <p>{amendment.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
