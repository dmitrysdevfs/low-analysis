"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "./AuthIcons";
import { useAuth } from "./AuthProvider";
import { notify } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import styles from "./AuthFormScreen.module.scss";

const HAS_GOOGLE_CLIENT = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleLoginButton({ isRegister }: { isRegister: boolean }) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await loginWithGoogle(tokenResponse.access_token);
      if (!result.ok) {
        notify.warning(result.error ?? "Помилка Google авторизації");
        return;
      }
      notify.success("Вхід через Google успішний");
      router.push(result.redirectTo ?? ROUTES.home);
    },
    onError: () => notify.warning("Помилка Google авторизації"),
  });

  return (
    <>
      <div className={styles.divider}>
        <span className={styles.dividerText}>або</span>
      </div>

      <button
        type="button"
        className={styles.googleButton}
        onClick={() => HAS_GOOGLE_CLIENT && handleGoogleLogin()}
        disabled={!HAS_GOOGLE_CLIENT}
        title={!HAS_GOOGLE_CLIENT ? "Google OAuth не налаштовано" : undefined}
      >
        <GoogleIcon />
        <span>Продовжити з Google</span>
      </button>

      <p className={styles.googleHint}>
        {isRegister
          ? "Працює для швидкої реєстрації"
          : "Працює для входу та реєстрації"}
      </p>
    </>
  );
}
