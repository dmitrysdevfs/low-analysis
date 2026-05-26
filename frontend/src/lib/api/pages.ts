import type {
  ManagedPageAdminResponse,
  ManagedPagePublicResponse,
  PageBuilderSnapshot,
  PageCatalogItem,
} from "@/types";
import { getJson } from "./laws";

export async function getPageCatalog(
  options?: RequestInit,
): Promise<PageCatalogItem[]> {
  return getJson<PageCatalogItem[]>("/pages", options);
}

export async function getPublicPage(
  slug: string,
  options?: RequestInit,
): Promise<ManagedPagePublicResponse> {
  return getJson<ManagedPagePublicResponse>(`/pages/${slug}`, options);
}

export async function getAdminPage(
  slug: string,
  options?: RequestInit,
): Promise<ManagedPageAdminResponse> {
  return getJson<ManagedPageAdminResponse>(`/admin/pages/${slug}`, options);
}

export async function saveAdminPageDraft(
  slug: string,
  draft: PageBuilderSnapshot,
  options?: RequestInit,
): Promise<ManagedPageAdminResponse> {
  return getJson<ManagedPageAdminResponse>(`/admin/pages/${slug}`, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(draft),
  });
}

export async function publishAdminPage(
  slug: string,
  options?: RequestInit,
): Promise<ManagedPageAdminResponse> {
  return getJson<ManagedPageAdminResponse>(`/admin/pages/${slug}/publish`, {
    ...options,
    method: "POST",
  });
}

export async function unpublishAdminPage(
  slug: string,
  options?: RequestInit,
): Promise<ManagedPageAdminResponse> {
  return getJson<ManagedPageAdminResponse>(`/admin/pages/${slug}/unpublish`, {
    ...options,
    method: "POST",
  });
}

export async function getAdminPageVersions(
  slug: string,
  options?: RequestInit,
) {
  return getJson<ManagedPageAdminResponse["versions"]>(
    `/admin/pages/${slug}/versions`,
    options,
  );
}

export async function restoreAdminPageVersion(
  slug: string,
  version: number,
  options?: RequestInit,
): Promise<ManagedPageAdminResponse> {
  return getJson<ManagedPageAdminResponse>(
    `/admin/pages/${slug}/restore/${version}`,
    {
      ...options,
      method: "POST",
    },
  );
}
