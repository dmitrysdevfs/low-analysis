"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useProposal, useSubmitProposal } from "@/hooks/useProposals";
import { useLawTree } from "@/hooks/useLawTree";
import { DiffViewer } from "@/components/ui";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import {
  LegislatorVolumeBar,
  getLegislatorVolumeBucket,
  type VolumeBucket,
} from "@/features/law-change/components/LegislatorVolumeBar";
import styles from "./page.module.scss";

function extractId(v: string | { _id: string } | null | undefined): string {
  if (!v) return "";
  return typeof v === "string" ? v : v._id;
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams() as { proposalId: string };
  const { data: proposal, isLoading } = useProposal(proposalId);
  const submitMutation = useSubmitProposal();

  const lawId = proposal ? extractId(proposal.law_id) : undefined;
  const { tree, law: lawData, loading: treeLoading } = useLawTree(lawId);

  const [volumeFilter, setVolumeFilter] = useState<VolumeBucket | null>(null);

  const elementZScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of tree) {
      if (node._id) map.set(node._id, node.z_score ?? 0);
    }
    return map;
  }, [tree]);

  const filteredAmendments = useMemo(() => {
    const amendments = proposal?.amendments ?? [];
    if (!volumeFilter) return amendments;
    return amendments.filter((a) => {
      const z = elementZScoreMap.get(a.element_id) ?? 0;
      return getLegislatorVolumeBucket(z) === volumeFilter;
    });
  }, [proposal?.amendments, volumeFilter, elementZScoreMap]);

  const handleVolumeClick = (level: VolumeBucket) => {
    setVolumeFilter((prev) => (prev === level ? null : level));
  };

  if (isLoading) return <div>Завантаження...</div>;
  if (!proposal) return <div>Пропозицію не знайдено</div>;

  return (
    <div className={styles.container}>
      <Link href={ROUTES.legislatorCabinet} className={styles.backLink}>
        ← Назад до кабінету
      </Link>

      <header className={styles.header}>
        <div>
          <h1>{proposal.title}</h1>
          {lawData && <p className={styles.lawRef}>📄 {lawData.title}</p>}
        </div>
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

        {!treeLoading && tree.length > 0 && (
          <LegislatorVolumeBar
            tree={tree}
            activeLevel={volumeFilter}
            onLevelClick={handleVolumeClick}
          />
        )}

        {filteredAmendments.length === 0 && volumeFilter && (
          <div className={styles.emptyFilter}>
            Немає поправок для елементів цього рівня обсягу
          </div>
        )}

        <div className={styles.amendments}>
          {filteredAmendments.map((amendment) => (
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
