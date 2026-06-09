"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { ROUTES } from "@/constants/routes";
import { notify } from "@/lib/toast";
import { MailIcon, FieldIcon } from "./AuthIcons";
import styles from "./AuthFormScreen.module.scss";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      notify.warning("Введіть адресу електронної пошти.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        notify.error(data.message || "Помилка. Спробуйте ще раз.");
        return;
      }
      setSent(true);
    } catch {
      notify.error("Помилка мережі. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
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

        <h1 className={styles.title}>Відновлення паролю</h1>

        {sent ? (
          <div>
            <p className={styles.subtitle}>
              Якщо акаунт з такою поштою існує — ми надіслали лист із посиланням
              для відновлення. Перевірте папку &quot;Вхідні&quot; та
              &quot;Спам&quot;.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              style={{ marginTop: "24px" }}
              onClick={() => router.push(ROUTES.authLogin)}
            >
              Повернутись до входу
            </button>
          </div>
        ) : (
          <>
            <p className={styles.subtitle}>
              Введіть email вашого акаунту — ми надішлемо посилання для
              відновлення паролю.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field} data-filled={email.length > 0}>
                <input
                  id="forgot-email"
                  className={styles.input}
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder=" "
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="forgot-email" className={styles.label}>
                  Електронна пошта
                </label>
                <FieldIcon>
                  <MailIcon />
                </FieldIcon>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Надсилаю..." : "Надіслати посилання"}
              </button>
            </form>

            <p className={styles.switchLine}>
              Згадали пароль?{" "}
              <button
                type="button"
                className={styles.switchLink}
                onClick={() => router.push(ROUTES.authLogin)}
              >
                Вхід
              </button>
            </p>
          </>
        )}
      </motion.div>
    </section>
  );
}
