import React from "react";
// @ts-expect-error: React 19 testing library typings mismatch for screen export in local workspace
import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "@/app/layout";
import Header from "@/layout/Header/Header";

vi.mock("@/components/layout/AppHeader", () => ({
  AppHeader: () => <div>Mock AppHeader</div>,
}));

describe("frontend layout wrappers", () => {
  it("renders Header through the AppHeader wrapper", () => {
    render(<Header />);
    expect(screen.getByText("Mock AppHeader")).toBeInTheDocument();
  });

  it("exports root metadata and html shell structure", () => {
    const titleDefault = (metadata.title as { default: string }).default;
    expect(titleDefault).toContain("Law Analysis");
    expect(metadata.description).toContain("законодавства України");

    const tree = RootLayout({
      children: <span>Дитина</span>,
    }) as React.ReactElement<{ lang: string; children: React.ReactElement }>;

    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("uk");

    const body = tree.props.children as React.ReactElement;
    expect(body.type).toBe("body");
  });
});
