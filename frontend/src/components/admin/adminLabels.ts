const ACCOUNT_TYPE_LABELS = {
  client: "Клієнт",
  admin: "Адмін",
} as const;

const ACCOUNT_SOURCE_LABELS = {
  stored: "Збережений",
  dev: "Розробницький",
} as const;

const ACCOUNT_STATUS_LABELS = {
  active: "Активний",
  inactive: "Неактивний",
} as const;

const PLAN_LABELS = {
  all: "Усі",
  client: "Клієнт",
  preview: "Прев'ю",
  trial: "Тріал",
  user: "Користувач",
  plus: "Плюс",
  pro: "Про",
  admin: "Адмін",
} as const;

const SEVERITY_LABELS = {
  all: "Усі",
  info: "Інфо",
  warning: "Попередження",
  security: "Безпека",
} as const;

const ACCESS_ROLE_LABELS = {
  Guest: "Гість",
  Client: "Клієнт",
  Admin: "Адмін",
  guest: "Гість",
  client: "Клієнт",
  admin: "Адмін",
} as const;

const CODE_STATUS_LABELS = {
  active: "активний",
  retired: "архівний",
  default: "початковий",
} as const;

export function formatAccountTypeLabel(value: string) {
  return ACCOUNT_TYPE_LABELS[value as keyof typeof ACCOUNT_TYPE_LABELS] ?? value;
}

export function formatAccountSourceLabel(value: string) {
  return ACCOUNT_SOURCE_LABELS[value as keyof typeof ACCOUNT_SOURCE_LABELS] ?? value;
}

export function formatAccountStatusLabel(value: string) {
  return ACCOUNT_STATUS_LABELS[value as keyof typeof ACCOUNT_STATUS_LABELS] ?? value;
}

export function formatPlanLabel(value: string | null | undefined) {
  if (!value) {
    return PLAN_LABELS.preview;
  }

  return PLAN_LABELS[value as keyof typeof PLAN_LABELS] ?? value;
}

export function formatPlanFilterLabel(value: string) {
  return PLAN_LABELS[value as keyof typeof PLAN_LABELS] ?? value;
}

export function formatSeverityLabel(value: string) {
  return SEVERITY_LABELS[value as keyof typeof SEVERITY_LABELS] ?? value;
}

export function formatAccessRoleLabel(value: string) {
  return ACCESS_ROLE_LABELS[value as keyof typeof ACCESS_ROLE_LABELS] ?? value;
}

export function formatBooleanLabel(value: boolean) {
  return value ? "Так" : "Ні";
}

export function formatCodeStatusLabel(value: string) {
  return CODE_STATUS_LABELS[value as keyof typeof CODE_STATUS_LABELS] ?? value;
}
