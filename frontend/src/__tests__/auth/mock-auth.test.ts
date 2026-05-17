import {
  loginMockAccount,
  readStoredAccounts,
  readStoredSession,
  registerMockAccount,
} from "@/lib/auth/mockAuth";

describe("mock auth role flows", () => {
  it("registers client accounts and redirects them to client login", () => {
    const result = registerMockAccount({
      displayName: "Client User",
      email: "client@low.test",
      password: "ClientPass1!",
      accountType: "client",
    });

    expect(result.ok).toBe(true);
    expect(result.redirectTo).toBe("/auth/login");
    expect(readStoredAccounts()).toHaveLength(1);
    expect(readStoredAccounts()[0]?.accountType).toBe("client");
  });

  it("requires super code for admin registration", () => {
    const result = registerMockAccount({
      displayName: "Admin User",
      email: "admin@low.test",
      password: "AdminPass1!",
      accountType: "admin",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("super code");
  });

  it("logs administrators into the admin panel route", () => {
    registerMockAccount({
      displayName: "Admin User",
      email: "admin@low.test",
      password: "AdminPass1!",
      accountType: "admin",
      superCode: "SUPER-001",
    });

    const result = loginMockAccount({
      email: "admin@low.test",
      password: "AdminPass1!",
      rememberMe: true,
      accountType: "admin",
    });

    expect(result.ok).toBe(true);
    expect(result.redirectTo).toBe("/admin");
    expect(readStoredSession()?.accountType).toBe("admin");
  });

  it("logs in with the built-in dev client credentials", () => {
    const result = loginMockAccount({
      email: "user",
      password: "777",
      rememberMe: true,
    });

    expect(result.ok).toBe(true);
    expect(result.redirectTo).toBe("/");
    expect(readStoredSession()?.displayName).toBe("Dev Client");
  });

  it("logs in with the built-in dev admin credentials", () => {
    const result = loginMockAccount({
      email: "admin",
      password: "888",
      rememberMe: true,
    });

    expect(result.ok).toBe(true);
    expect(result.redirectTo).toBe("/admin");
    expect(readStoredSession()?.displayName).toBe("Dev Admin");
    expect(readStoredSession()?.accountType).toBe("admin");
  });
});
