"use client";

import { useMemo } from "react";
import { getRoleColor, getRoleLabel } from "@/lib/tree";
import type { TreeNode } from "@/types";
import styles from "./SubjectRoleStrip.module.scss";

interface SubjectRoleStripProps {
  elements: TreeNode[];
  subjectId: string;
  activeRole: string | null;
  onRoleChange: (role: string | null) => void;
}

export function SubjectRoleStrip({
  elements,
  subjectId,
  activeRole,
  onRoleChange,
}: SubjectRoleStripProps) {
  const roleCounts = useMemo(() => {
    const map = new Map<string, number>();
    elements.forEach((el) => {
      const role = el.subjects?.find((s) => s.subject_id === subjectId)?.role;
      if (role) map.set(role, (map.get(role) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [elements, subjectId]);

  if (roleCounts.length === 0) return null;

  return (
    <div className={styles.strip}>
      <span className={styles.label}>Зустрічається як:</span>

      <button
        className={`${styles.chip} ${activeRole === null ? styles.chipActive : ""}`}
        style={{ "--rc": "var(--color-azure)" } as React.CSSProperties}
        onClick={() => onRoleChange(null)}
      >
        Всі · {elements.length}
      </button>

      {roleCounts.map(([role, count]) => (
        <button
          key={role}
          className={`${styles.chip} ${activeRole === role ? styles.chipActive : ""}`}
          style={{ "--rc": getRoleColor(role) } as React.CSSProperties}
          onClick={() => onRoleChange(role)}
        >
          {getRoleLabel(role)} · {count}
        </button>
      ))}
    </div>
  );
}
