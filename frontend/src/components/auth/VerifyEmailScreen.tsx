"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { ROUTES } from "@/constants/routes";
import { verifyEmailToken } from "@/lib/auth/authClient";
import styles from "./AuthFormScreen.module.scss";

export function VerifyEmailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Посилання недійсне або протерміноване.");
      return;
    }

    verifyEmailToken(token).then((result) => {
      if (result.ok) {
        setStatus("success");
        setTimeout(() => {
          router.replace(result.redirectTo ?? ROUTES.account);
        }, 2000);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Помилка підтвердження.");
      }
    });
  }, [token, router]);

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

        {status === "loading" && (
          <>
            <h1 className={styles.title}>Підтвердження email</h1>
            <p className={styles.subtitle}>Перевіряємо посилання...</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className={styles.title}>Email підтверджено ✓</h1>
            <p className={styles.subtitle}>
              Акаунт активовано. Перенаправлення до кабінету...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className={styles.title}>Помилка підтвердження</h1>
            <p className={styles.subtitle}>{errorMsg}</p>
            <button
              type="button"
              className={styles.submitButton}
              style={{ marginTop: 24 }}
              onClick={() => router.push(ROUTES.authLogin)}
            >
              Повернутись до входу
            </button>
          </>
        )}
      </motion.div>
    </section>
  );
}
