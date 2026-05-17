export type PasswordTone = "idle" | "weak" | "medium" | "strong";

export type PasswordRule = {
  key: string;
  label: string;
  passes: boolean;
};

export type PasswordStrength = {
  label: string;
  tone: PasswordTone;
  percent: number;
  rules: PasswordRule[];
  score: number;
};

export function createPasswordRules(password: string): PasswordRule[] {
  const hasLowercaseLetter = /\p{Ll}/u.test(password);
  const hasUppercaseLetter = /\p{Lu}/u.test(password);
  const hasDigit = /\p{Nd}/u.test(password);
  const hasSpecialCharacter = /[\p{P}\p{S}]/u.test(password);

  return [
    {
      key: "case",
      label: "Малі та великі літери",
      passes: hasLowercaseLetter && hasUppercaseLetter,
    },
    {
      key: "number",
      label: "Цифра (0-9)",
      passes: hasDigit,
    },
    {
      key: "symbol",
      label: "Спеціальний символ (!@#$%^&*)",
      passes: hasSpecialCharacter,
    },
    {
      key: "length",
      label: "Мінімум 8 символів",
      passes: password.length >= 8,
    },
  ];
}

export function getStrength(password: string): PasswordStrength {
  const rules = createPasswordRules(password);
  const score = rules.filter((rule) => rule.passes).length;

  if (!password) {
    return { label: "Очікування", tone: "idle", percent: 0, rules, score };
  }

  if (score <= 1) {
    return { label: "Слабкий", tone: "weak", percent: 28, rules, score };
  }

  if (score <= 3) {
    return { label: "Середній", tone: "medium", percent: 68, rules, score };
  }

  return { label: "Надійний", tone: "strong", percent: 100, rules, score };
}
