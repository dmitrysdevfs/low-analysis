"use client";

import {
  getAdminPage,
  publishAdminPage,
  restoreAdminPageVersion,
  saveAdminPageDraft,
  unpublishAdminPage,
} from "@/lib/api";
import type { ManagedPageAdminResponse, PageBuilderSnapshot } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_BUILDER_QUERY_KEY = (slug: string) => ["project-page-builder", slug];

export function useProjectPageBuilder(slug: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PAGE_BUILDER_QUERY_KEY(slug),
    queryFn: () => getAdminPage(slug),
  });

  const syncPage = (page: ManagedPageAdminResponse) => {
    queryClient.setQueryData(PAGE_BUILDER_QUERY_KEY(slug), page);
    return page;
  };

  const saveDraftMutation = useMutation({
    mutationFn: (draft: PageBuilderSnapshot) => saveAdminPageDraft(slug, draft),
    onSuccess: syncPage,
  });

  const publishMutation = useMutation({
    mutationFn: () => publishAdminPage(slug),
    onSuccess: syncPage,
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishAdminPage(slug),
    onSuccess: syncPage,
  });

  const restoreMutation = useMutation({
    mutationFn: (version: number) => restoreAdminPageVersion(slug, version),
    onSuccess: syncPage,
  });

  return {
    page: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    saveDraft: saveDraftMutation.mutateAsync,
    publish: publishMutation.mutateAsync,
    unpublish: unpublishMutation.mutateAsync,
    restoreVersion: restoreMutation.mutateAsync,
    saving:
      saveDraftMutation.isPending ||
      publishMutation.isPending ||
      unpublishMutation.isPending ||
      restoreMutation.isPending,
    publishing: publishMutation.isPending,
    unpublishing: unpublishMutation.isPending,
    restoring: restoreMutation.isPending,
  };
}
