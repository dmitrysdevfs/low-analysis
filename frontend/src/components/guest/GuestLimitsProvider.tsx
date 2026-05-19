"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import { ROUTES } from "@/constants/routes";
import {
  attemptGuestAction,
  formatRemainingCooldown,
  getGuestLimitSnapshot,
  type GuestLimitAttemptResult,
  type GuestLimitSnapshot,
  type GuestLimitType,
  GUEST_LIMITS_STORAGE_KEY,
} from "@/lib/guestLimits";
import type {
  BillingQuotaAttemptResult,
  BillingSubscriptionSnapshot,
} from "@/types";
import styles from "./GuestLimitsProvider.module.scss";

type GuestLimitModalState = {
  open: boolean;
  type: GuestLimitType;
  reason: "limit" | "cooldown" | "preview_limit" | "plan_limit";
  message: string;
};

type AccessAttemptResult = GuestLimitAttemptResult | BillingQuotaAttemptResult;

type GuestLimitsContextValue = {
  isGuest: boolean;
  snapshot: GuestLimitSnapshot;
  consumeSearch: () => AccessAttemptResult;
  consumeView: (resourceKey: string) => AccessAttemptResult;
};

const EMPTY_SNAPSHOT = {
  search: {
    limit: 6,
    used: 0,
    remaining: 6,
    windowMs: 10 * 60 * 1000,
    cooldownMs: 2 * 60 * 1000,
    cooldownUntil: 0,
    cooldownRemainingMs: 0,
    isCoolingDown: false,
  },
  view: {
    limit: 12,
    used: 0,
    remaining: 12,
    windowMs: 15 * 60 * 1000,
    cooldownMs: 3 * 60 * 1000,
    cooldownUntil: 0,
    cooldownRemainingMs: 0,
    isCoolingDown: false,
  },
} satisfies GuestLimitSnapshot;

const GUEST_LIMITS_DEFAULT: GuestLimitsContextValue = {
  isGuest: false,
  snapshot: EMPTY_SNAPSHOT,
  consumeSearch: () => ({ allowed: true, snapshot: EMPTY_SNAPSHOT }),
  consumeView: () => ({ allowed: true, snapshot: EMPTY_SNAPSHOT }),
};

const GuestLimitsContext =
  createContext<GuestLimitsContextValue>(GUEST_LIMITS_DEFAULT);

const GUEST_WELCOME_STORAGE_KEY = "low-analysis.guest.welcome-shown.v1";
const GUEST_WELCOME_AUTO_CLOSE_MS = 60 * 1000;

function buildAdminQuotaSnapshot(
  userId: string,
  existing?: BillingSubscriptionSnapshot | null,
): BillingSubscriptionSnapshot {
  if (existing) {
    return existing;
  }

  return {
    userId,
    accountType: "admin",
    planId: null,
    plan: null,
    status: "active",
    accessLabel: "Admin access",
    description:
      "Administrative access bypasses client billing quotas in this local demo.",
    daysRemaining: null,
    isUnlimited: true,
    searchLimit: null,
    viewLimit: null,
    searchUsed: 0,
    viewUsed: 0,
    searchRemaining: null,
    viewRemaining: null,
    previewMode: false,
  };
}

export function GuestLimitsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { subscription, consumeQuota } = useBilling();
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<GuestLimitSnapshot>(() =>
    getGuestLimitSnapshot(),
  );
  const [modal, setModal] = useState<GuestLimitModalState | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const isGuest = !isAuthenticated;
  const userId = user?.id ?? "admin-session";

  const refreshSnapshot = useCallback(() => {
    setSnapshot(getGuestLimitSnapshot());
  }, []);

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot, isGuest]);

  useEffect(() => {
    if (!isGuest || pathname.startsWith(ROUTES.auth)) {
      setWelcomeOpen(false);
      setModal(null);
      return;
    }

    const wasShown =
      window.localStorage.getItem(GUEST_WELCOME_STORAGE_KEY) === "1";

    if (wasShown) {
      return;
    }

    window.localStorage.setItem(GUEST_WELCOME_STORAGE_KEY, "1");
    setWelcomeOpen(true);
  }, [isGuest, pathname]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === GUEST_LIMITS_STORAGE_KEY) {
        refreshSnapshot();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshSnapshot]);

  useEffect(() => {
    if (!isGuest) {
      return;
    }

    function handleVisibilityRefresh() {
      refreshSnapshot();
    }

    window.addEventListener("focus", handleVisibilityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.removeEventListener("focus", handleVisibilityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [isGuest, refreshSnapshot]);

  useEffect(() => {
    if (!welcomeOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setWelcomeOpen(false);
    }, GUEST_WELCOME_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [welcomeOpen]);

  const openModalFromAttempt = useCallback(
    (result: AccessAttemptResult, type: GuestLimitType) => {
      if (!result.allowed && result.reason && result.message) {
        setWelcomeOpen(false);
        setModal({
          open: true,
          type,
          reason: result.reason,
          message: result.message,
        });
      }
    },
    [],
  );

  const consumeSearch = useCallback(() => {
    if (!isGuest) {
      if (user?.accountType === "admin") {
        return {
          allowed: true,
          snapshot: buildAdminQuotaSnapshot(userId, subscription),
        };
      }

      const result = consumeQuota("search");
      openModalFromAttempt(result, "search");
      return result;
    }

    const result = attemptGuestAction("search");
    setSnapshot(result.snapshot);
    openModalFromAttempt(result, "search");
    return result;
  }, [
    consumeQuota,
    isGuest,
    openModalFromAttempt,
    subscription,
    user?.accountType,
    userId,
  ]);

  const consumeView = useCallback(
    (resourceKey: string) => {
      if (!isGuest) {
        if (user?.accountType === "admin") {
          return {
            allowed: true,
            snapshot: buildAdminQuotaSnapshot(userId, subscription),
          };
        }

        const result = consumeQuota("view");
        openModalFromAttempt(result, "view");
        return result;
      }

      const result = attemptGuestAction("view", { resourceKey });
      setSnapshot(result.snapshot);
      openModalFromAttempt(result, "view");
      return result;
    },
    [
      consumeQuota,
      isGuest,
      openModalFromAttempt,
      subscription,
      user?.accountType,
      userId,
    ],
  );

  const contextValue = useMemo(
    () => ({
      isGuest,
      snapshot,
      consumeSearch,
      consumeView,
    }),
    [consumeSearch, consumeView, isGuest, snapshot],
  );

  const cooldownMeta =
    modal?.type === "search"
      ? formatRemainingCooldown(snapshot.search.cooldownRemainingMs)
      : formatRemainingCooldown(snapshot.view.cooldownRemainingMs);
  const isBillingModal =
    modal?.reason === "preview_limit" || modal?.reason === "plan_limit";
  const billingSearchLine =
    subscription?.searchRemaining === null
      ? "Unlimited"
      : `${subscription?.searchRemaining ?? 0} / ${subscription?.searchLimit ?? 0}`;
  const billingViewLine =
    subscription?.viewRemaining === null
      ? "Unlimited"
      : `${subscription?.viewRemaining ?? 0} / ${subscription?.viewLimit ?? 0}`;

  return (
    <GuestLimitsContext.Provider value={contextValue}>
      {children}

      <Dialog
        open={welcomeOpen}
        onOpenChange={setWelcomeOpen}
        title="Повний доступ до Law Analysis"
        description="Щоб отримати повний доступ до безперервного пошуку, особистих добірок і робочих інструментів, увійдіть або зареєструйтеся."
        maxWidth={560}
      >
        <div className={styles.body}>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>
                Гість бачить усі публічні сторінки
              </div>
              <div className={styles.summaryMeta}>
                Закони, суб&apos;єкти та пошук уже відкриті, але інтенсивні
                запити та глибокі перегляди працюють із м&apos;якими лімітами.
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>Це вікно зникне саме</div>
              <div className={styles.summaryMeta}>
                Якщо хочеш просто продовжити як гість, нічого не треба робити:
                підказка закриється приблизно за 1 хвилину.
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href={ROUTES.authLogin} className={styles.primaryAction}>
              Увійти
            </Link>
            <Link
              href={ROUTES.authRegister}
              className={styles.primaryActionAlt}
            >
              Зареєструватися
            </Link>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setWelcomeOpen(false)}
            >
              Продовжити як гість
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(modal?.open)}
        onOpenChange={(open) =>
          setModal((current) => (current ? { ...current, open } : null))
        }
        title={
          modal?.reason === "cooldown"
            ? "Кулдаун для гостя активний"
            : modal?.reason === "preview_limit"
              ? "Ліміт preview-доступу вичерпано"
              : modal?.reason === "plan_limit"
                ? "Ліміт поточного плану вичерпано"
                : "Ліміт гостя вичерпано"
        }
        description={modal?.message}
        maxWidth={520}
      >
        <div className={styles.body}>
          <div className={styles.summary}>
            {isBillingModal && subscription ? (
              <>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryTitle}>
                    Поточний рівень доступу: {subscription.accessLabel}
                  </div>
                  <div className={styles.summaryMeta}>
                    {subscription.previewMode
                      ? "Preview-доступ залишає акаунт активним, але показує вужчу квоту запитів."
                      : subscription.endsAt
                        ? `План активний до ${new Date(
                            subscription.endsAt,
                          ).toLocaleDateString("uk-UA")}.`
                        : "Поточний план керує вашими квотами запитів у demo-середовищі."}
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryTitle}>
                    Залишок квот: пошук {billingSearchLine} · перегляди{" "}
                    {billingViewLine}
                  </div>
                  <div className={styles.summaryMeta}>
                    Оновіть план або перейдіть на вищий рівень, щоб збільшити
                    ліміти чи повернути безліміт.
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryTitle}>
                    Пошуків залишилось: {snapshot.search.remaining} /{" "}
                    {snapshot.search.limit}
                  </div>
                  <div className={styles.summaryMeta}>
                    {snapshot.search.isCoolingDown
                      ? `Кулдаун пошуку закінчиться приблизно через ${cooldownMeta}.`
                      : "Пошук для гостя обмежений по всіх вкладках для зниження навантаження."}
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryTitle}>
                    Глибоких переглядів залишилось: {snapshot.view.remaining} /{" "}
                    {snapshot.view.limit}
                  </div>
                  <div className={styles.summaryMeta}>
                    Детальні перегляди включають дерева законів, статті та
                    сторінки суб&apos;єктів і відстежуються по всіх вкладках.
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.actions}>
            {isBillingModal ? (
              <>
                <Link
                  href={ROUTES.accountBilling}
                  className={styles.primaryAction}
                >
                  План та оплата
                </Link>
                <Link
                  href={ROUTES.accountCheckout}
                  className={styles.primaryActionAlt}
                >
                  Перейти до checkout
                </Link>
              </>
            ) : (
              <Link href={ROUTES.auth} className={styles.primaryAction}>
                Зареєструватися або увійти
              </Link>
            )}
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() =>
                setModal((current) =>
                  current ? { ...current, open: false } : null,
                )
              }
            >
              Продовжити
            </button>
          </div>
        </div>
      </Dialog>
    </GuestLimitsContext.Provider>
  );
}

export function useGuestLimits() {
  return useContext(GuestLimitsContext);
}
