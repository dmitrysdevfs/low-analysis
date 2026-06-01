"use client";

import { useState } from "react";
import { useCreateAmendment } from "@/hooks/useAmendments";
import { useProposals } from "@/hooks/useProposals";
import type { TreeBranch } from "@/lib/tree";
import styles from "./AmendmentEditor.module.scss";

interface AmendmentEditorProps {
  node: TreeBranch;
  lawId: string;
  onClose: () => void;
}

export function AmendmentEditor({
  node,
  lawId,
  onClose,
}: AmendmentEditorProps) {
  const [proposedText, setProposedText] = useState(node.text || "");
  const [reason, setReason] = useState("");
  const [proposalId, setProposalId] = useState("");

  const { data: proposals } = useProposals({ lawId });
  const createMutation = useCreateAmendment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      law_id: lawId,
      element_id: node._id,
      proposal_id: proposalId || undefined,
      change_type: "edit",
      proposed_text: proposedText,
      reason,
    });
    onClose();
  };

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label>Запропонований текст:</label>
        <textarea
          value={proposedText}
          onChange={(e) => setProposedText(e.target.value)}
          rows={5}
        />
      </div>
      <div className={styles.field}>
        <label>Обгрунтування:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      <div className={styles.field}>
        <label>Виберіть пропозицію (опційно):</label>
        <select
          value={proposalId}
          onChange={(e) => setProposalId(e.target.value)}
        >
          <option value="">Створити нову пізніше</option>
          {proposals
            ?.filter((p) => p.status === "draft")
            .map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
        </select>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onClose}>
          Скасувати
        </button>
        <button type="submit" disabled={createMutation.isPending}>
          Зберегти поправку
        </button>
      </div>
    </form>
  );
}
