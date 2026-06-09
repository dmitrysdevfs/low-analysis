"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { ROUTES } from "@/constants/routes";
import { notify } from "@/lib/toast";
import { EyeIcon, CheckIcon, FieldIcon } from "./AuthIcons";
import { getStrength } from "./passwordStrength";
import styles from "./AuthFormScreen.module.scss";

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = getStrength(password);
  const passwordsMatch = confirm === password;
  const ready =
    token.length > 0 &&
    strength.score === strength.rules.length &&
    confirm.length > 0 &&
    passwordsMatch;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready) {
      if (!token) {
        notify.error("Токен відсутній. Перейдіть за посиланням з листа.");
      } else if (strength.score < strength.rules.length) {
        notify.warning("Пароль не відповідає всім вимогам.");
      } else if (!passwordsMatch) {
        notify.warning("Паролі не збігаються.");
      }
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify.error(data.message || "Помилка. Спробуйте ще раз.");
        return;
      }
      setDone(true);
      notify.success("Пароль успішно змінено!");
    } catch {
      notify.error("Помилка мережі. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className={styles.page}>
        <div className={styles.spotlight} />
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className={styles.subtitle}>
            Недійсне посилання. Запросіть нове на сторінці відновлення паролю.
          </p>
          <button
            type="button"
            className={styles.submitButton}
            style={{ marginTop: "24px" }}
            onClick={() => router.push(ROUTES.authForgotPassword)}
          >
            Відновити пароль
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.spotlight} />
      <div className={styles.wallGlow} />

      <motion.div
        className={styles.card}
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
        </div>

        <h1 className={styles.title}>Новий пароль</h1>

        {done ? (
          <div>
            <p className={styles.subtitle}>
              Пароль успішно змінено. Тепер ви можете увійти з новим паролем.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              style={{ marginTop: "24px" }}
              onClick={() => router.push(ROUTES.authLogin)}
            >
              Увійти
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field} data-filled={password.length > 0}>
              <input
                id="reset-password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="new-password"
                placeholder=" "
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="reset-password" className={styles.label}>
                Новий пароль
              </label>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>

            <div className={styles.field} data-filled={confirm.length > 0}>
              <input
                id="reset-confirm"
                className={styles.input}
                type="password"
                value={confirm}
                autoComplete="new-password"
                placeholder=" "
                onChange={(e) => setConfirm(e.target.value)}
              />
              <label htmlFor="reset-confirm" className={styles.label}>
                Підтвердіть пароль
              </label>
              <FieldIcon>
                <CheckIcon active={passwordsMatch && confirm.length > 0} />
              </FieldIcon>
            </div>

            <div className={styles.strengthCard}>
              <div className={styles.strengthHeader}>
                <div>
                  <div className={styles.strengthTitle}>Перевірка паролю</div>
                  <div className={styles.strengthCaption}>
                    Пароль має відповідати всім вимогам нижче
                  </div>
                </div>
                <div className={`${styles.strengthPill} ${styles[`strengthPill${strength.tone}`]}`}>
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
              {!passwordsMatch && confirm ? (
                <p className={styles.inlineError}>Паролі ще не збігаються.</p>
              ) : null}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !ready}
            >
              {loading ? "Зберігаю..." : "Встановити пароль"}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
