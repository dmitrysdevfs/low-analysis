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
  clearStoredSession,
  loginUser,
  readStoredSession,
  registerUser,
  getProfile,
  updateUserProfile,
  changeUserPassword as changePasswordApi,
  logoutUserApi,
} from "@/lib/auth/authClient";
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
  isLegislator: boolean;
  user: AuthSession | null;
  login: (payload: LoginPayload) => Promise<AuthActionResult>;
  register: (payload: RegisterPayload) => Promise<AuthActionResult>;
  updateProfile: (displayName: string) => Promise<AuthActionResult>;
  changePassword: (
    currentPassword: string,
    nextPassword: string,
  ) => Promise<AuthActionResult>;
  logout: () => void;
};

const AUTH_CONTEXT_DEFAULT: AuthContextValue = {
  isHydrated: false,
  isAuthenticated: false,
  isAdmin: false,
  isLegislator: false,
  user: null,
  login: async () => ({ ok: false, error: "Auth provider is unavailable." }),
  register: async () => ({ ok: false, error: "Auth provider is unavailable." }),
  updateProfile: async () => ({
    ok: false,
    error: "Auth provider is unavailable.",
  }),
  changePassword: async () => ({
    ok: false,
    error: "Auth provider is unavailable.",
  }),
  logout: () => {},
};

const AuthContext = createContext<AuthContextValue>(AUTH_CONTEXT_DEFAULT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const stored = readStoredSession();
      if (stored) {
        setUser(stored);
        // Verify session with backend
        const profile = await getProfile();
        if (profile) {
          setUser(profile);
        } else {
          setUser(null);
        }
      }
      setIsHydrated(true);
    };
    initAuth();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginUser(payload);

    if (result.ok && result.session) {
      setUser(result.session);
    }

    return result;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    return registerUser(payload);
  }, []);

  const updateProfile = useCallback(async (displayName: string) => {
    const result = await updateUserProfile(displayName);

    if (result.ok && result.session) {
      setUser(result.session);
    }

    return result;
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      return changePasswordApi(currentPassword, nextPassword);
    },
    [],
  );

  const logout = useCallback(() => {
    logoutUserApi(); // Trigger API logout asynchronously
    clearStoredSession();
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      isHydrated,
      isAuthenticated: !!user,
      isAdmin: user?.accountType === "admin",
      isLegislator:
        user?.accountType === "admin" || !!user?.roles?.includes("legislator"),
      user,
      login,
      register,
      updateProfile,
      changePassword,
      logout,
    }),
    [changePassword, isHydrated, login, logout, register, updateProfile, user],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
