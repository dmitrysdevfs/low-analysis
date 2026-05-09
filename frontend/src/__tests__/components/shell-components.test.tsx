import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LawCard } from "@/components/LawCard";
import { Layout } from "@/components/Layout";
import layoutStyles from "@/components/Layout.module.scss";
import Footer from "@/layout/Footer/Footer";
import { LAW_FIXTURE } from "@/test/fixtures";

describe("shell components", () => {
  it("renders breadcrumb items with links and a current item", () => {
    render(
      <Breadcrumb
        items={[{ label: "Закони", href: "/laws" }, { label: "Стаття 1" }]}
      />,
    );

    expect(screen.getByRole("link", { name: "Закони" })).toHaveAttribute(
      "href",
      "/laws",
    );
    expect(screen.getByText("Стаття 1")).toBeInTheDocument();
    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
  });

  it("applies full-height mode in Layout when requested", () => {
    const { rerender, container } = render(
      <Layout>
        <span>Вміст</span>
      </Layout>,
    );

    expect(container.firstChild).toHaveClass(layoutStyles.layout);
    expect(container.firstChild).not.toHaveClass(layoutStyles.layoutFullHeight);

    rerender(
      <Layout fullHeight>
        <span>Вміст</span>
      </Layout>,
    );

    expect(container.firstChild).toHaveClass(layoutStyles.layoutFullHeight);
  });

  it("renders law cards with title, code and counters", () => {
    render(<LawCard law={LAW_FIXTURE} index={0} />);

    expect(screen.getAllByText(LAW_FIXTURE.title).length).toBeGreaterThan(0);
    expect(screen.getByText(LAW_FIXTURE.code)).toBeInTheDocument();
    expect(screen.getByText("розділів")).toBeInTheDocument();
    expect(screen.getByText("статей")).toBeInTheDocument();
    expect(screen.getByText("абзаців")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link")
        .some(
          (link) => link.getAttribute("href") === `/laws/${LAW_FIXTURE._id}`,
        ),
    ).toBe(true);
  });

  it("renders footer branding and docs link", () => {
    render(<Footer />);

    expect(screen.getByText(/Low Analysis/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Документація API/i }),
    ).toHaveAttribute("href", "/api-docs");
  });
});
