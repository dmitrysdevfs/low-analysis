"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { ROUTES } from "@/constants/routes";
import { notify } from "@/lib/toast";
import type { AuthAccountType, LoginPayload, RegisterPayload } from "@/types";
import { getStrength } from "./passwordStrength";
import {
  FieldIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  EyeIcon,
  CheckIcon,
} from "./AuthIcons";
import { useAuth } from "./AuthProvider";
import styles from "./AuthFormScreen.module.scss";

type AuthMode = "login" | "register";

type AuthFormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  superCode: string;
  rememberMe: boolean;
  acceptTerms: boolean;
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const LOGIN_IDENTIFIER_MIN_LENGTH = 2;
const SUPER_CODE_MIN_LENGTH = 8;

const COPY = {
  login: {
    title: "Вхід",
    clientSubtitle: "Безпечний доступ до вашого акаунту Law Analysis.",
    adminSubtitle: "Обмежений доступ до адміністративної панелі.",
    submitLabel: "Увійти",
    adminSubmitLabel: "Вхід адміністратора",
    switchLead: "Немає акаунту?",
    switchLabel: "Реєстрація",
    switchAriaLabel: "Перейти до форми реєстрації",
  },
  register: {
    title: "Реєстрація",
    clientSubtitle: "Створіть стандартний клієнтський акаунт.",
    adminSubtitle: "Створіть адміністративний акаунт з підвищеними правами.",
    submitLabel: "Створити акаунт",
    adminSubmitLabel: "Створити адміна",
    switchLead: "Вже є акаунт?",
    switchLabel: "Вхід",
    switchAriaLabel: "Перейти до форми входу",
  },
} as const;

export function AuthFormScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { login, register, isAuthenticated, isHydrated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    router.replace(isAdmin ? ROUTES.admin : ROUTES.account);
  }, [isHydrated, isAuthenticated, isAdmin, router]);
  const roleParam = searchParams.get("role");
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [accountType, setAccountType] = useState<AuthAccountType>(
    roleParam === "admin" ? "admin" : "client",
  );
  const [form, setForm] = useState<AuthFormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    superCode: "",
    rememberMe: true,
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    setAccountType(roleParam === "admin" ? "admin" : "client");
  }, [roleParam]);

  const isRegister = currentMode === "register";
  const isAdminAccount = accountType === "admin";
  const requiresSuperCode = isRegister && isAdminAccount;
  const copy = COPY[currentMode];
  const strength = getStrength(form.password);
  const trimmedName = form.fullName.trim();
  const trimmedEmail = form.email.trim();
  const trimmedSuperCode = form.superCode.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const loginIdentifierValid =
    trimmedEmail.length >= LOGIN_IDENTIFIER_MIN_LENGTH;
  const superCodeReady =
    !requiresSuperCode || trimmedSuperCode.length >= SUPER_CODE_MIN_LENGTH;
  const passwordsMatch = !isRegister || form.confirmPassword === form.password;
  const subtitle = isAdminAccount ? copy.adminSubtitle : copy.clientSubtitle;
  const submitLabel =
    isRegister && isAdminAccount ? copy.adminSubmitLabel : copy.submitLabel;
  const loginSubtitle = COPY.login.clientSubtitle;

  const loginPayload: LoginPayload = {
    email: trimmedEmail,
    password: form.password,
    rememberMe: form.rememberMe,
    accountType: accountType,
  };

  const registerPayload: RegisterPayload = {
    displayName: trimmedName,
    email: trimmedEmail,
    password: form.password,
    accountType,
    superCode: requiresSuperCode ? trimmedSuperCode : undefined,
  };

  const registerReady =
    trimmedName.length >= 2 &&
    emailValid &&
    superCodeReady &&
    strength.score === strength.rules.length &&
    form.confirmPassword.length > 0 &&
    passwordsMatch &&
    form.acceptTerms;

  const loginReady = loginIdentifierValid && form.password.trim().length > 0;

  function setField<K extends keyof AuthFormState>(
    field: K,
    value: AuthFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateRoleInUrl(nextAccountType: AuthAccountType) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("role", nextAccountType);
    const nextUrl = `${pathname}?${nextSearchParams.toString()}`;
    router.replace(nextUrl);
  }

  function handleAccountTypeSwitch(nextAccountType: AuthAccountType) {
    setAccountType(nextAccountType);
    setForm((current) => ({
      ...current,
      superCode:
        nextAccountType === "admin" && currentMode === "register"
          ? current.superCode
          : "",
    }));
    updateRoleInUrl(nextAccountType);
  }

  function handleModeSwitch(nextMode: AuthMode) {
    setCurrentMode(nextMode);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isRegister && !registerReady) {
      if (trimmedName.length < 2) {
        notify.warning("Введіть повне ім'я (мінімум 2 символи).");
      } else if (!emailValid) {
        notify.warning("Введіть коректну електронну пошту.");
      } else if (strength.score < strength.rules.length) {
        notify.warning("Пароль не відповідає всім вимогам.");
      } else if (form.confirmPassword.length === 0) {
        notify.warning("Підтвердьте пароль.");
      } else if (!passwordsMatch) {
        notify.warning("Паролі не збігаються.");
      } else if (!superCodeReady) {
        notify.warning("Введіть супер-код адміна (мінімум 8 символів).");
      } else if (!form.acceptTerms) {
        notify.warning("Підтвердьте умови використання.");
      }
      return;
    }

    if (!isRegister && !loginReady) {
      notify.warning("Введіть правильний логін або email та пароль.");
      return;
    }

    if (isRegister) {
      const result = await register(registerPayload);

      if (!result.ok) {
        notify.warning(result.error ?? "Помилка реєстрації.");
        return;
      }

      notify.success(
        isAdminAccount
          ? "Акаунт адміна створено. Продовжіть зі входом адміна."
          : "Клієнтський акаунт створено. Продовжіть зі входом.",
      );
      router.push(ROUTES.authLogin);
      setForm((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
        superCode: "",
        acceptTerms: false,
      }));
      return;
    }

    const result = await login(loginPayload);

    if (!result.ok) {
      notify.warning(result.error ?? "Помилка входу.");
      return;
    }

    notify.success(
      result.session?.accountType === "admin"
        ? "Сесію адміністратора відкрито."
        : "Клієнтську сесію відкрито.",
    );
    router.push(result.redirectTo ?? ROUTES.home);
  }

  return (
    <section className={styles.page}>
      <div className={styles.spotlight} />
      <div className={styles.wallGlow} />

      <motion.div
        className={styles.card}
        data-account-type={accountType}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.cardShine} />

        <div className={styles.headerRow}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>
              <TryzubMark size={22} variant="header" />
            </span>
            <span className={styles.brandText}>Law Analysis</span>
          </div>

          <div className={styles.modeToggle} aria-label="Authentication switch">
            {(["login", "register"] as const).map((toggleMode) => {
              const isActive = currentMode === toggleMode;

              return (
                <button
                  key={toggleMode}
                  type="button"
                  className={`${styles.modeToggleItem} ${isActive ? styles.modeToggleItemActive : ""}`}
                  aria-pressed={isActive}
                  aria-label={
                    toggleMode === "login"
                      ? "Перейти до вкладки входу"
                      : "Перейти до вкладки реєстрації"
                  }
                  onClick={() => handleModeSwitch(toggleMode)}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="auth-mode-toggle-pill"
                      className={styles.modeToggleHighlight}
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 32,
                      }}
                    />
                  ) : null}
                  <span className={styles.modeToggleLabel}>
                    {toggleMode === "login" ? "Вхід" : "Реєстрація"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.subtitle}>
          {isRegister ? subtitle : loginSubtitle}
        </p>

        {isRegister ? (
          <div className={styles.accessPanel}>
            <div className={styles.accessPanelHeader}>
              <span className={styles.accessLabel}>Рівень доступу</span>
              <span className={styles.accessBadge}>
                {isAdminAccount ? "Адмін-доступ" : "Клієнтський доступ"}
              </span>
            </div>

            <div
              className={styles.accessToggle}
              role="group"
              aria-label="Account type"
            >
              {(["client", "admin"] as const).map((toggleAccountType) => {
                const isActive = accountType === toggleAccountType;

                return (
                  <button
                    key={toggleAccountType}
                    type="button"
                    className={`${styles.accessToggleItem} ${isActive ? styles.accessToggleItemActive : ""}`}
                    aria-pressed={isActive}
                    onClick={() => handleAccountTypeSwitch(toggleAccountType)}
                  >
                    {toggleAccountType === "client" ? "Клієнт" : "Адмін"}
                  </button>
                );
              })}
            </div>

            <p className={styles.accessHint}>
              {isAdminAccount
                ? "Реєстрація адміністратора потребує активного супер-коду з панелі адміна."
                : "Клієнтський доступ відкриває платформу без адміністративних інструментів."}
            </p>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={submitForm} noValidate>
          {isRegister ? (
            <div className={styles.field} data-filled={trimmedName.length > 0}>
              <input
                id="auth-name"
                className={styles.input}
                type="text"
                value={form.fullName}
                autoComplete="name"
                placeholder=" "
                onChange={(event) => setField("fullName", event.target.value)}
              />
              <label htmlFor="auth-name" className={styles.label}>
                Повне ім'я
              </label>
              <FieldIcon>
                <UserIcon />
              </FieldIcon>
            </div>
          ) : null}

          <div className={styles.field} data-filled={trimmedEmail.length > 0}>
            <input
              id="auth-email"
              className={styles.input}
              type="text"
              value={form.email}
              autoComplete={isRegister ? "email" : "username"}
              placeholder=" "
              onChange={(event) => setField("email", event.target.value)}
            />
            <label htmlFor="auth-email" className={styles.label}>
              {isRegister ? "Електронна пошта" : "Логін або email"}
            </label>
            <FieldIcon>
              <MailIcon />
            </FieldIcon>
          </div>

          <div className={styles.field} data-filled={form.password.length > 0}>
            <input
              id="auth-password"
              className={styles.input}
              type={showPassword ? "text" : "password"}
              value={form.password}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder=" "
              onChange={(event) => setField("password", event.target.value)}
            />
            <label htmlFor="auth-password" className={styles.label}>
              Пароль
            </label>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>

          {isRegister ? (
            <>
              <div
                className={styles.field}
                data-filled={form.confirmPassword.length > 0}
              >
                <input
                  id="auth-confirm-password"
                  className={styles.input}
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  placeholder=" "
                  onChange={(event) =>
                    setField("confirmPassword", event.target.value)
                  }
                />
                <label htmlFor="auth-confirm-password" className={styles.label}>
                  Підтвердіть пароль
                </label>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword
                      ? "Приховати підтвердження паролю"
                      : "Показати підтвердження паролю"
                  }
                >
                  <EyeIcon off={showConfirmPassword} />
                </button>
              </div>

              {requiresSuperCode ? (
                <div
                  className={styles.field}
                  data-filled={trimmedSuperCode.length > 0}
                >
                  <input
                    id="auth-super-code"
                    className={styles.input}
                    type="password"
                    value={form.superCode}
                    autoComplete="one-time-code"
                    placeholder=" "
                    onChange={(event) =>
                      setField("superCode", event.target.value)
                    }
                  />
                  <label htmlFor="auth-super-code" className={styles.label}>
                    Супер-код
                  </label>
                  <FieldIcon>
                    <ShieldIcon />
                  </FieldIcon>
                </div>
              ) : null}

              <div className={styles.strengthCard}>
                <div className={styles.strengthHeader}>
                  <div>
                    <div className={styles.strengthTitle}>Перевірка паролю</div>
                    <div className={styles.strengthCaption}>
                      Пароль має відповідати всім вимогам нижче
                    </div>
                  </div>
                  <div
                    className={`${styles.strengthPill} ${styles[`strengthPill${strength.tone}`]}`}
                  >
                    {strength.label}
                  </div>
                </div>

                <div className={styles.track}>
                  <span
                    className={`${styles.fill} ${styles[`fill${strength.tone}`]}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>

                <ul className={styles.rules}>
                  {strength.rules.map((rule) => (
                    <li
                      key={rule.key}
                      className={`${styles.rule} ${rule.passes ? styles.ruleActive : ""}`}
                    >
                      <span className={styles.ruleIcon}>
                        <CheckIcon active={rule.passes} />
                      </span>
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>

                {!passwordsMatch && form.confirmPassword ? (
                  <p className={styles.inlineError}>Паролі ще не збігаються.</p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className={styles.actionsRow}>
            {isRegister ? (
              <label className={styles.checkboxLine}>
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(event) =>
                    setField("acceptTerms", event.target.checked)
                  }
                />
                <span>
                  Я погоджуюся з{" "}
                  <a
                    href={ROUTES.legal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.termsLink}
                  >
                    умовами використання
                  </a>{" "}
                  та{" "}
                  <a
                    href={ROUTES.legal + "#privacy"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.termsLink}
                  >
                    політикою конфіденційності
                  </a>
                </span>
              </label>
            ) : (
              <>
                <label className={styles.checkboxLine}>
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(event) =>
                      setField("rememberMe", event.target.checked)
                    }
                  />
                  <span>Запам'ятати мене</span>
                </label>

                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => router.push(ROUTES.authForgotPassword)}
                >
                  Забули пароль?
                </button>
              </>
            )}
          </div>

          <button type="submit" className={styles.submitButton}>
            {submitLabel}
          </button>
        </form>

        <p className={styles.switchLine}>
          {copy.switchLead}{" "}
          <button
            type="button"
            className={styles.switchLink}
            aria-label={copy.switchAriaLabel}
            onClick={() => handleModeSwitch(isRegister ? "login" : "register")}
          >
            {copy.switchLabel}
          </button>
        </p>
      </motion.div>
    </section>
  );
}
