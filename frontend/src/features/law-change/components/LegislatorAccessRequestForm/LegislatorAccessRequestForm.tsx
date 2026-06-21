"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useMyAccessRequest,
  useSubmitAccessRequest,
  useRevokeRole,
} from "@/features/law-change/hooks/useLegislatorAccess";
import { useAuth } from "@/components/auth/AuthProvider";
import type { RequestedRole } from "@/types/law-change.types";
import styles from "./LegislatorAccessRequestForm.module.scss";

const ROLE_LABELS: Record<RequestedRole, string> = {
  legislator: "Законотворець",
  supervisor: "Супервізор",
};

const ROLE_DESCRIPTIONS: Record<RequestedRole, string> = {
  legislator: "Подача пропозицій, поправок та форків законопроектів",
  supervisor: "Нагляд, моніторинг та управління активністю платформи",
};

const COOLDOWN_MS = 24 * 3_600_000;

function useCooldownTimer(updatedAt: string | null | undefined): number {
  const getRemaining = useCallback(() => {
    if (!updatedAt) return 0;
    const elapsed = Date.now() - new Date(updatedAt).getTime();
    return Math.max(0, COOLDOWN_MS - elapsed);
  }, [updatedAt]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!updatedAt) return;
    setRemaining(getRemaining());
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [updatedAt, getRemaining]);

  return remaining;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LegislatorAccessRequestForm() {
  const { isLegislator, isSupervisor } = useAuth();
  const { data: request, isLoading } = useMyAccessRequest();
  const submit = useSubmitAccessRequest();
  const revoke = useRevokeRole();

  const [selectedRole, setSelectedRole] = useState<RequestedRole>("legislator");
  const [organization, setOrganization] = useState("");
  const [reason, setReason] = useState("");

  const cooldownMs = useCooldownTimer(
    request?.status === "rejected" ? request.updatedAt : null,
  );
  const isCoolingDown = cooldownMs > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.trim() || !reason.trim()) return;
    await submit.mutateAsync({ organization, reason, requestedRole: selectedRole });
  };

  const handleRevoke = async () => {
    if (!window.confirm("Ви впевнені? Ваша поточна роль буде відкликана.")) return;
    await revoke.mutateAsync();
  };

  if (isLoading) {
    return <div className={styles.loading}>Завантаження...</div>;
  }

  // User already has a special role — offer to revoke it
  if (isLegislator || isSupervisor) {
    const currentRole = isLegislator ? "Законотворець" : "Супервізор";
    const otherRole = isLegislator ? "Супервізор" : "Законотворець";
    return (
      <div className={styles.roleCard}>
        <div className={styles.roleActive}>
          <span className={styles.checkIcon}>✓</span>
          <span>Ви маєте роль <strong>{currentRole}</strong></span>
        </div>
        <p className={styles.revokeHint}>
          Щоб отримати роль <strong>{otherRole}</strong>, спочатку відмовтесь від поточної ролі.
        </p>
        <button
          type="button"
          className={styles.revokeBtn}
          onClick={handleRevoke}
          disabled={revoke.isPending}
        >
          {revoke.isPending ? "Відкликання..." : `Відмовитись від ролі ${currentRole}`}
        </button>
      </div>
    );
  }

  // Pending request
  if (request?.status === "pending") {
    return (
      <div className={`${styles.statusBox} ${styles.statusPending}`}>
        <span className={styles.statusIcon}>⏳</span>
        <div>
          <p className={styles.statusText}>
            Запит на роль <strong>{ROLE_LABELS[request.requestedRole]}</strong> очікує розгляду.
          </p>
          <p className={styles.statusHint}>Очікуйте відповіді адміністратора.</p>
        </div>
      </div>
    );
  }

  // Approved (but auth not refreshed yet)
  if (request?.status === "approved") {
    return (
      <div className={`${styles.statusBox} ${styles.statusApproved}`}>
        <span className={styles.statusIcon}>✓</span>
        <p className={styles.statusText}>Запит схвалено! Оновіть сторінку.</p>
      </div>
    );
  }

  // Rejected — show timer or allow re-submit
  if (request?.status === "rejected") {
    return (
      <div className={styles.roleCard}>
        <div className={`${styles.statusBox} ${styles.statusRejected}`}>
          <span className={styles.statusIcon}>✕</span>
          <div>
            <p className={styles.statusText}>Запит відхилено.</p>
            {request.adminNote && (
              <p className={styles.adminNote}>Примітка: {request.adminNote}</p>
            )}
          </div>
        </div>

        {isCoolingDown ? (
          <div className={styles.cooldown}>
            <span className={styles.cooldownIcon}>⏱</span>
            <span>Повторний запит через:</span>
            <span className={styles.cooldownTimer}>{formatDuration(cooldownMs)}</span>
          </div>
        ) : (
          <RequestForm
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            organization={organization}
            setOrganization={setOrganization}
            reason={reason}
            setReason={setReason}
            onSubmit={handleSubmit}
            isPending={submit.isPending}
            error={submit.isError ? (submit.error as Error).message : null}
          />
        )}
      </div>
    );
  }

  // No request yet
  return (
    <RequestForm
      selectedRole={selectedRole}
      setSelectedRole={setSelectedRole}
      organization={organization}
      setOrganization={setOrganization}
      reason={reason}
      setReason={setReason}
      onSubmit={handleSubmit}
      isPending={submit.isPending}
      error={submit.isError ? (submit.error as Error).message : null}
    />
  );
}

interface RequestFormProps {
  selectedRole: RequestedRole;
  setSelectedRole: (r: RequestedRole) => void;
  organization: string;
  setOrganization: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error: string | null;
}

function RequestForm({
  selectedRole,
  setSelectedRole,
  organization,
  setOrganization,
  reason,
  setReason,
  onSubmit,
  isPending,
  error,
}: RequestFormProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h3 className={styles.title}>Запит на роль</h3>

      <div className={styles.roleToggle}>
        {(["legislator", "supervisor"] as RequestedRole[]).map((role) => (
          <button
            key={role}
            type="button"
            className={`${styles.roleOption} ${selectedRole === role ? styles.roleOptionActive : ""}`}
            onClick={() => setSelectedRole(role)}
          >
            <span className={styles.roleOptionLabel}>{ROLE_LABELS[role]}</span>
            <span className={styles.roleOptionDesc}>{ROLE_DESCRIPTIONS[role]}</span>
          </button>
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Організація</label>
        <input
          type="text"
          className={styles.input}
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Назва організації або установи"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Обґрунтування</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Поясніть, чому вам потрібен доступ..."
          required
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? "Надсилання..." : "Надіслати запит"}
      </button>
    </form>
  );
}
