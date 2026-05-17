"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  changeMockPassword,
  clearStoredSession,
  loginMockAccount,
  readStoredSession,
  registerMockAccount,
  updateMockProfile,
} from "@/lib/auth/mockAuth";
import type { AuthSession, LoginPayload, RegisterPayload } from "@/types";

type AuthActionResult = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  session?: AuthSession;
};

type AuthContextValue = {
  isHydrated: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthSession | null;
  login: (payload: LoginPayload) => AuthActionResult;
  register: (payload: RegisterPayload) => AuthActionResult;
  updateProfile: (displayName: string) => AuthActionResult;
  changePassword: (currentPassword: string, nextPassword: string) => AuthActionResult;
  logout: () => void;
};

const AUTH_CONTEXT_DEFAULT: AuthContextValue = {
  isHydrated: false,
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  login: () => ({ ok: false, error: "Auth provider is unavailable." }),
  register: () => ({ ok: false, error: "Auth provider is unavailable." }),
  updateProfile: () => ({ ok: false, error: "Auth provider is unavailable." }),
  changePassword: () => ({ ok: false, error: "Auth provider is unavailable." }),
  logout: () => {},
};

const AuthContext = createContext<AuthContextValue>(AUTH_CONTEXT_DEFAULT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(() => readStoredSession());
  const [isHydrated, setIsHydrated] = useState(typeof window !== "undefined");

  useEffect(() => {
    if (!isHydrated) {
      setUser(readStoredSession());
      setIsHydrated(true);
    }
  }, [isHydrated]);

  const login = useCallback((payload: LoginPayload) => {
    const result = loginMockAccount(payload);

    if (result.ok && result.session) {
      setUser(result.session);
    }

    return result;
  }, []);

  const register = useCallback((payload: RegisterPayload) => {
    return registerMockAccount(payload);
  }, []);

  const updateProfile = useCallback((displayName: string) => {
    if (!user) {
      return { ok: false, error: "No active session found." };
    }

    const result = updateMockProfile({
      userId: user.id,
      displayName,
    });

    if (result.ok && result.session) {
      setUser(result.session);
    }

    return result;
  }, [user]);

  const changePassword = useCallback((currentPassword: string, nextPassword: string) => {
    if (!user) {
      return { ok: false, error: "No active session found." };
    }

    const result = changeMockPassword({
      userId: user.id,
      currentPassword,
      nextPassword,
    });

    if (result.ok && result.session) {
      setUser(result.session);
    }

    return result;
  }, [user]);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    isHydrated,
    isAuthenticated: !!user,
    isAdmin: user?.accountType === "admin",
    user,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
  }), [changePassword, isHydrated, login, logout, register, updateProfile, user]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
