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
  user: AuthSession | null;
  login: (payload: LoginPayload) => Promise<AuthActionResult>;
  register: (payload: RegisterPayload) => Promise<AuthActionResult>;
  updateProfile: (displayName: string) => AuthActionResult;
  changePassword: (
    currentPassword: string,
    nextPassword: string,
  ) => AuthActionResult;
  logout: () => void;
};

const AUTH_CONTEXT_DEFAULT: AuthContextValue = {
  isHydrated: false,
  isAuthenticated: false,
  isAdmin: false,
  user: null,
  login: async () => ({ ok: false, error: "Auth provider is unavailable." }),
  register: async () => ({ ok: false, error: "Auth provider is unavailable." }),
  updateProfile: () => ({ ok: false, error: "Auth provider is unavailable." }),
  changePassword: () => ({ ok: false, error: "Auth provider is unavailable." }),
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

  const updateProfile = useCallback(
    (displayName: string) => {
      // Mock for now as backend endpoint is not specified in Stage 4 checklist
      return { ok: false, error: "Update profile not yet implemented on backend." };
    },
    [],
  );

  const changePassword = useCallback(
    (currentPassword: string, nextPassword: string) => {
      // Mock for now as backend endpoint is not specified in Stage 4 checklist
      return { ok: false, error: "Change password not yet implemented on backend." };
    },
    [],
  );


  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      isHydrated,
      isAuthenticated: !!user,
      isAdmin: user?.accountType === "admin",
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
