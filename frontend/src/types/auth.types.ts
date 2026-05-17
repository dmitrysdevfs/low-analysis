export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  accountType: AuthAccountType;
}

export type AuthAccountType = "client" | "admin";

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
  accountType?: AuthAccountType;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  accountType: AuthAccountType;
  superCode?: string;
}

export interface StoredAuthAccount extends AuthUser {
  password: string;
  superCode?: string;
  createdAt: string;
  lastLoginAt?: string;
  status?: "active" | "inactive";
}

export interface AuthSession extends AuthUser {
  lastLoginAt: string;
}

export interface AuthSuccessResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}
