"use client";

import type { AssistantRole } from "../types";
import styles from "./AssistantRolePicker.module.scss";

const ROLES: {
  id: AssistantRole;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: "general",
    label: "Загальний",
    icon: "⚖️",
    desc: "Загальна допомога з законодавством України",
  },
  {
    id: "lawyer",
    label: "Адвокат",
    icon: "🏛️",
    desc: "Захист прав, підстави оскарження, строки",
  },
  {
    id: "prosecutor",
    label: "Прокурор",
    icon: "⚔️",
    desc: "Кваліфікація діяння, санкції, доказова база",
  },
  {
    id: "judge",
    label: "Суддя",
    icon: "👨‍⚖️",
    desc: "Нейтральний аналіз, норми права, прецеденти",
  },
  {
    id: "notary",
    label: "Нотаріус",
    icon: "📋",
    desc: "Правочини, реєстрація, нотаріальні процедури",
  },
  {
    id: "business",
    label: "Підприємець",
    icon: "🧑‍💼",
    desc: "Права бізнесу, штрафи, дозволи — просто",
  },
];

export const ROLE_LABELS: Record<AssistantRole, string> = {
  general: "Загальний",
  lawyer: "Адвокат",
  prosecutor: "Прокурор",
  judge: "Суддя",
  notary: "Нотаріус",
  business: "Підприємець",
};

interface Props {
  onSelect: (role: AssistantRole) => void;
}

export function AssistantRolePicker({ onSelect }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <p className={styles.greeting}>
          Вітаю! Я — <strong>Lex</strong>, AI Помічник платформи Law Analysis.
        </p>
        <p className={styles.question}>Оберіть режим консультації:</p>
      </div>
      <div className={styles.grid}>
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect(role.id)}
          >
            <span className={styles.icon}>{role.icon}</span>
            <span className={styles.label}>{role.label}</span>
            <span className={styles.desc}>{role.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
