import { render, screen, waitFor } from "@testing-library/react";
import AdminProjectPage from "@/app/admin/project-page/page";
import ProjectInfoPage from "@/app/project-info/page";
import { getPublicPage } from "@/lib/api";
import { useProjectPageBuilder } from "@/features/page-builder/hooks/useProjectPageBuilder";
import type {
  ManagedPageAdminResponse,
  ManagedPagePublicResponse,
} from "@/types";

vi.mock("@/features/page-builder/hooks/useProjectPageBuilder", () => ({
  useProjectPageBuilder: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getPublicPage: vi.fn(),
  };
});

const PUBLIC_PAGE_FIXTURE: ManagedPagePublicResponse = {
  slug: "project-info",
  status: "published",
  title: "Інформація про проєкт",
  description: "Публічний контент builder-сторінки.",
  seo: {
    title: "Інформація про проєкт | Low Analysis",
    description: "Builder-driven public page.",
    ogImage: "",
  },
  updatedAt: new Date("2026-05-26T12:00:00.000Z").toISOString(),
  publishedAt: new Date("2026-05-26T12:00:00.000Z").toISOString(),
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      enabled: true,
      variant: "split",
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
      data: {
        eyebrow: "Low Analysis",
        title: "Інформація про проєкт",
        subtitle: "Окремий публічний маршрут, зібраний через builder.",
        primaryButtonLabel: "Перейти до пошуку",
        primaryButtonHref: "/search",
        secondaryButtonLabel: "Відкрити аналіз",
        secondaryButtonHref: "/analysis",
      },
    },
  ],
};

const ADMIN_PAGE_FIXTURE: ManagedPageAdminResponse = {
  slug: "project-info",
  title: "Інформація про проєкт",
  status: "published",
  updatedAt: new Date("2026-05-26T12:00:00.000Z").toISOString(),
  publishedAt: new Date("2026-05-26T12:00:00.000Z").toISOString(),
  draft: {
    title: "Інформація про проєкт",
    description: "Draft версія builder-сторінки.",
    seo: {
      title: "Інформація про проєкт | Low Analysis",
      description: "Draft SEO description",
      ogImage: "",
    },
    blocks: PUBLIC_PAGE_FIXTURE.blocks,
  },
  published: {
    title: "Інформація про проєкт",
    description: "Published версія builder-сторінки.",
    seo: {
      title: "Інформація про проєкт | Low Analysis",
      description: "Published SEO description",
      ogImage: "",
    },
    blocks: PUBLIC_PAGE_FIXTURE.blocks,
  },
  versions: [
    {
      version: 3,
      kind: "publish",
      savedAt: new Date("2026-05-26T12:00:00.000Z").toISOString(),
      savedBy: "admin-1",
      title: "Інформація про проєкт",
      blockCount: 1,
    },
  ],
};

describe("Project page builder routes", () => {
  it("renders the public project info page from the API payload", async () => {
    vi.mocked(getPublicPage).mockResolvedValue(PUBLIC_PAGE_FIXTURE);

    render(<ProjectInfoPage />);

    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: "Інформація про проєкт" })
          .length,
      ).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/публічний контент builder-сторінки/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /перейти до пошуку/i }),
    ).toHaveAttribute("href", "/search");
  });

  it("renders the admin project page builder and version controls", async () => {
    vi.mocked(useProjectPageBuilder).mockReturnValue({
      page: ADMIN_PAGE_FIXTURE,
      loading: false,
      error: null,
      refetch: vi.fn(),
      saveDraft: vi.fn(),
      publish: vi.fn(),
      unpublish: vi.fn(),
      restoreVersion: vi.fn(),
      saving: false,
      publishing: false,
      unpublishing: false,
      restoring: false,
    });

    render(<AdminProjectPage />);

    expect(
      screen.getAllByRole("heading", { name: "Інформація про проєкт" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /перейти на сайт/i }),
    ).toHaveAttribute("href", "/project-info");
    expect(
      screen.getByRole("button", { name: /опублікувати/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /версії/i })).toBeInTheDocument();
  });
});
