import React from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { resetNavigationMocks } from "./mocks/next-navigation";

function hasPathname(value: unknown): value is { pathname?: string | null } {
  return typeof value === "object" && value !== null && "pathname" in value;
}

type MockLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: unknown;
  children: React.ReactNode;
};

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: MockLinkProps) => {
    const normalizedHref =
      typeof href === "string"
        ? href
        : hasPathname(href)
          ? String(href.pathname ?? "")
          : String(href ?? "");

    return React.createElement(
      "a",
      {
        href: normalizedHref,
        ...props,
      },
      children,
    );
  },
}));

vi.mock("next/navigation", async () => import("./mocks/next-navigation"));
vi.mock("framer-motion", async () => import("./mocks/framer-motion"));
vi.mock("next/font/google", () => {
  const mockFont = (options: { variable?: string } = {}) => ({
    className: "mock-font",
    variable: options.variable ?? "--mock-font",
    style: { fontFamily: "mock-font" },
  });

  return {
    Cormorant_Garamond: mockFont,
    Inter: mockFont,
    JetBrains_Mono: mockFont,
  };
});

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  cleanup();
  resetNavigationMocks();
  vi.clearAllMocks();
});
