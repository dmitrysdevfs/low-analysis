import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useGoogleLogin: () => vi.fn(),
  GoogleLogin: () => null,
}));

describe("auth pages", () => {
  it("switches from login to register inside the same auth card", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Вхід" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Клієнт" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Логін або email")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Увійти" })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Перейти до вкладки реєстрації" }),
    );

    expect(
      screen.getByRole("heading", { name: "Реєстрація" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Повне ім'я")).toBeInTheDocument();
    expect(screen.getByText("Перевірка паролю")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Адмін" }));

    expect(screen.getByLabelText("Супер-код")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Створити адміна" }),
    ).toBeInTheDocument();
  });

  it("switches from register to login inside the same auth card", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: "Реєстрація" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Повне ім'я")).toBeInTheDocument();
    expect(screen.getByText("Перевірка паролю")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Перейти до вкладки входу" }),
    );

    expect(screen.getByRole("heading", { name: "Вхід" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Повне ім'я")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Супер-код")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Адмін" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Увійти" })).toBeInTheDocument();
  });

  it("accepts mixed uppercase and lowercase Cyrillic letters in password rules", () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText("Пароль");

    fireEvent.change(passwordInput, { target: { value: "ыЮФвам123!" } });

    expect(screen.getByText("Надійний")).toBeInTheDocument();
  });
});
