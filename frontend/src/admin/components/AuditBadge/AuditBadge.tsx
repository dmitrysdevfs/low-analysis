"use client";

import { motion } from "framer-motion";
import styles from "./AuditBadge.module.scss";

type Severity = "info" | "warning" | "security";

interface AuditBadgeProps {
  severity: Severity;
  label: string;
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; border: string }> = {
  info:     { color: "#93b7ff", bg: "rgba(74,128,212,0.15)",  border: "rgba(74,128,212,0.3)" },
  warning:  { color: "#f2d06c", bg: "rgba(200,168,67,0.15)",  border: "rgba(200,168,67,0.3)" },
  security: { color: "#f08080", bg: "rgba(192,57,43,0.15)",   border: "rgba(192,57,43,0.3)" },
};

export function AuditBadge({ severity, label }: AuditBadgeProps) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;

  return (
    <span
      className={styles.badge}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {severity === "security" && (
        <motion.span
          className={styles.dot}
          style={{ background: cfg.color }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {label}
    </span>
  );
}
