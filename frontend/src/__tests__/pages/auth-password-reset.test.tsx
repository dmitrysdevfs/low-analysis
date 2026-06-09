import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen";
import { server } from "@/test/msw/server";
import {
  getRouterMock,
  setMockSearchParams,
} from "@/test/mocks/next-navigation";
import { notify } from "@/lib/toast";

vi.mock("@/lib/toast", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// ── ForgotPasswordScreen ────────────────────────────────────────

describe("ForgotPasswordScreen", () => {
  it("renders email input and submit button", () => {
    render(<ForgotPasswordScreen />);
    expect(screen.getByLabelText("Електронна пошта")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Надіслати посилання" }),
    ).toBeInTheDocument();
  });

  it("shows warning when submitted with empty email", async () => {
    render(<ForgotPasswordScreen />);
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Надіслати посилання" })
        .closest("form")!,
    );
    expect(notify.warning).toHaveBeenCalled();
  });

  it("shows success state after successful API response", async () => {
    server.use(
      http.post("/api/auth/forgot-password", () =>
        HttpResponse.json({
          message: "If this email exists, a reset link was sent.",
        }),
      ),
    );

    render(<ForgotPasswordScreen />);
    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(
      screen.getByLabelText("Електронна пошта").closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Повернутись до входу" }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Електронна пошта")).not.toBeInTheDocument();
  });

  it("shows error notification on API failure", async () => {
    server.use(
      http.post("/api/auth/forgot-password", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    );

    render(<ForgotPasswordScreen />);
    fireEvent.change(screen.getByLabelText("Електронна пошта"), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(
      screen.getByLabelText("Електронна пошта").closest("form")!,
    );

    await waitFor(() => {
      expect(notify.error).toHaveBeenCalledWith("Server error");
    });
    // Form remains visible — user can retry
    expect(screen.getByLabelText("Електронна пошта")).toBeInTheDocument();
  });

  it("navigates to login when 'Вхід' link is clicked", () => {
    render(<ForgotPasswordScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Вхід" }));
    expect(getRouterMock().push).toHaveBeenCalled();
  });
});

// ── ResetPasswordScreen ─────────────────────────────────────────

describe("ResetPasswordScreen", () => {
  it("shows invalid link message when no token in URL", () => {
    // searchParams is empty by default (reset in afterEach)
    render(<ResetPasswordScreen />);
    expect(screen.getByText(/Недійсне посилання/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Новий пароль")).not.toBeInTheDocument();
  });

  it("shows password form when token is present in URL", () => {
    setMockSearchParams({ token: "valid-reset-token" });
    render(<ResetPasswordScreen />);
    expect(screen.getByLabelText("Новий пароль")).toBeInTheDocument();
    expect(screen.getByLabelText("Підтвердіть пароль")).toBeInTheDocument();
  });

  it("shows warning when passwords do not match", async () => {
    setMockSearchParams({ token: "valid-reset-token" });
    render(<ResetPasswordScreen />);

    fireEvent.change(screen.getByLabelText("Новий пароль"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Підтвердіть пароль"), {
      target: { value: "DifferentPass1!" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Встановити пароль" })
        .closest("form")!,
    );

    expect(notify.warning).toHaveBeenCalledWith(
      expect.stringMatching(/збігаються/i),
    );
  });

  it("shows done state after successful password reset", async () => {
    server.use(
      http.post("/api/auth/reset-password", () =>
        HttpResponse.json({ message: "Password reset successfully" }),
      ),
    );

    setMockSearchParams({ token: "valid-reset-token" });
    render(<ResetPasswordScreen />);

    fireEvent.change(screen.getByLabelText("Новий пароль"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Підтвердіть пароль"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Встановити пароль" }));

    await waitFor(() => {
      expect(notify.success).toHaveBeenCalledWith("Пароль успішно змінено!");
    });
    await waitFor(() => {
      expect(screen.getByText(/Пароль успішно змінено/i)).toBeInTheDocument();
    });
  });

  it("shows error notification on invalid or expired token", async () => {
    server.use(
      http.post("/api/auth/reset-password", () =>
        HttpResponse.json(
          { message: "Invalid or expired reset token" },
          { status: 400 },
        ),
      ),
    );

    setMockSearchParams({ token: "expired-token" });
    render(<ResetPasswordScreen />);

    fireEvent.change(screen.getByLabelText("Новий пароль"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByLabelText("Підтвердіть пароль"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Встановити пароль" }));

    await waitFor(() => {
      expect(notify.error).toHaveBeenCalledWith(
        "Invalid or expired reset token",
      );
    });
  });
});
