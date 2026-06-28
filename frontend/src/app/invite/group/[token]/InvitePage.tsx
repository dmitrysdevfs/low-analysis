"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/authClient";
import type { AuthSession } from "@/types";
import {
  useInviteInfo,
  useJoinByInvite,
  useRegisterAndJoin,
} from "@/hooks/useInvite";
import styles from "@/components/auth/AuthFormScreen.module.scss";

export function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const { isAuthenticated, isHydrated, user } = useAuth();

  const { data: invite, isLoading, error } = useInviteInfo(token || null);
  const joinMutation = useJoinByInvite();
  const registerMutation = useRegisterAndJoin();

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const handleJoin = async () => {
    try {
      const result = await joinMutation.mutateAsync(token);
      if (result.alreadyMember) {
        notify.success("Ви вже є учасником цієї групи");
      } else {
        notify.success(`Ви приєдналися до групи «${result.groupName}»`);
      }
      router.replace(ROUTES.legislatorCabinetGroups);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Помилка приєднання до групи",
      );
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      notify.error("Заповніть усі поля");
      return;
    }
    try {
      const data = await registerMutation.mutateAsync({ token, data: form });
      // Store session — cookie is set by backend
      const session: AuthSession = {
        id: data._id,
        displayName: data.fullName,
        email: data.email,
        roles: [data.role],
        accountType: "client",
        lastLoginAt: new Date().toISOString(),
      };
      window.localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify(session),
      );
      notify.success(`Акаунт створено! Ви приєдналися до «${data.groupName}»`);
      window.location.replace(ROUTES.legislatorCabinetGroups);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Помилка реєстрації",
      );
    }
  };

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

        {isLoading && (
          <>
            <h1 className={styles.title}>Запрошення до групи</h1>
            <p className={styles.subtitle}>Завантаження інформації...</p>
          </>
        )}

        {!isLoading && error && (
          <>
            <h1 className={styles.title}>Посилання недійсне</h1>
            <p className={styles.subtitle}>
              Запрошення протерміноване або вже відкликане.
            </p>
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

        {!isLoading && !error && invite && (
          <>
            <h1 className={styles.title}>Запрошення до групи</h1>
            <p className={styles.subtitle}>
              Вас запросили до групи{" "}
              <strong style={{ color: "var(--color-accent, #5b9cf6)" }}>
                «{invite.groupName}»
              </strong>
              {invite.groupCourse ? ` · ${invite.groupCourse}` : ""}
            </p>

            {isHydrated && isAuthenticated ? (
              /* ── Авторизований ── */
              <div style={{ marginTop: 24 }}>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-smoke)",
                    marginBottom: 16,
                  }}
                >
                  Ви увійшли як{" "}
                  <strong style={{ color: "var(--color-text)" }}>
                    {user?.email}
                  </strong>
                </p>
                <button
                  type="button"
                  className={styles.submitButton}
                  disabled={joinMutation.isPending}
                  onClick={handleJoin}
                >
                  {joinMutation.isPending ? "Приєднання..." : "Приєднатися до групи"}
                </button>
              </div>
            ) : isHydrated ? (
              /* ── Неавторизований ── */
              <form
                onSubmit={handleRegister}
                style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}
              >
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-smoke)",
                    marginBottom: 4,
                  }}
                >
                  Для участі створіть акаунт:
                </p>

                <input
                  className={styles.input}
                  type="text"
                  placeholder="Повне ім'я"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  required
                />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Пароль (мін. 8 символів)"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={8}
                />

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={registerMutation.isPending}
                  style={{ marginTop: 8 }}
                >
                  {registerMutation.isPending
                    ? "Реєстрація..."
                    : "Створити акаунт та приєднатися"}
                </button>

                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-smoke)",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Вже є акаунт?{" "}
                  <a
                    href={`${ROUTES.authLogin}?redirect=/invite/group/${token}`}
                    style={{ color: "var(--color-accent, #5b9cf6)" }}
                  >
                    Увійти
                  </a>
                </p>
              </form>
            ) : null}
          </>
        )}
      </motion.div>
    </section>
  );
}
