"use client";

import { useState } from "react";
import type { LawChangeType } from "@/types/law-change.types";
import { useCreateProposal, useSubmitProposal } from "@/features/law-change/hooks/useProposalMutations";
import styles from "./ProposeChangeForm.module.scss";

interface ProposeChangeFormProps {
  lawId: string;
  elementId?: string;
  originalText?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CHANGE_TYPES: { value: LawChangeType; label: string }[] = [
  { value: "edit", label: "Редагування" },
  { value: "add", label: "Додавання" },
  { value: "delete", label: "Видалення" },
  { value: "move", label: "Переміщення" },
];

export function ProposeChangeForm({ lawId, elementId, originalText, onClose, onSuccess }: ProposeChangeFormProps) {
  const [changeType, setChangeType] = useState<LawChangeType>("edit");
  const [proposedText, setProposedText] = useState("");
  const [reason, setReason] = useState("");

  const createProposal = useCreateProposal();
  const submitProposal = useSubmitProposal();

  const showProposedText = changeType !== "delete";

  const buildPayload = () => ({
    law_id: lawId,
    element_id: elementId ?? null,
    change_type: changeType,
    proposed_text: showProposedText ? proposedText : undefined,
    reason,
  });

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createProposal.mutateAsync(buildPayload());
    if (result) onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createProposal.mutateAsync(buildPayload());
    if (created) {
      await submitProposal.mutateAsync({ id: created._id, data: { reason } });
      onSuccess();
    }
  };

  const isPending = createProposal.isPending || submitProposal.isPending;
  const error = createProposal.error || submitProposal.error;

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>Нова пропозиція змін</h3>

      {originalText && (
        <div className={styles.originalBlock}>
          <span className={styles.label}>Поточний текст</span>
          <p className={styles.originalText}>{originalText}</p>
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Тип зміни</label>
        <select className={styles.select} value={changeType} onChange={e => setChangeType(e.target.value as LawChangeType)}>
          {CHANGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {showProposedText && (
        <div className={styles.field}>
          <label className={styles.label}>Новий текст</label>
          <textarea className={styles.textarea} rows={4} value={proposedText} onChange={e => setProposedText(e.target.value)} placeholder="Введіть запропонований текст..." />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Обґрунтування</label>
        <textarea className={styles.textarea} rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Поясніть причину змін..." />
      </div>

      {error && <p className={styles.error}>{(error as Error).message}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isPending}>Скасувати</button>
        <button type="button" className={styles.draftBtn} onClick={handleDraft} disabled={isPending}>Зберегти як чернетку</button>
        <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={isPending}>Подати на голосування</button>
      </div>
    </div>
  );
}
