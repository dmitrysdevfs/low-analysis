"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SearchResults } from "@/components/search/SearchResults";
import { useGuestLimits } from "@/components/guest/GuestLimitsProvider";
import { GUEST_VISIBLE_RESULTS_LIMIT, useSearch } from "@/hooks/useSearch";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordWorkspaceSearch } from "@/lib/auth/clientWorkspace";

function SearchResultsContent() {
  const urlParams = useSearchParams();
  const { user } = useAuth();
  const { results, loading, error, searched, search } = useSearch();
  const { isGuest } = useGuestLimits();

  const q = urlParams.get("q") || "";
  const docType = urlParams.get("docType") || "";
  const dateFrom = urlParams.get("dateFrom") || "";
  const dateTo = urlParams.get("dateTo") || "";
  const number = urlParams.get("number") || "";
  const status = urlParams.get("status") || "";
  const wordField = (urlParams.get("wordField") || "title") as
    | "title"
    | "text"
    | "code";
  const numberType = (urlParams.get("numberType") || "starts") as
    | "starts"
    | "contains"
    | "exact";
  const sort = (urlParams.get("sort") || "date") as
    | "date"
    | "title"
    | "relevance";

  useEffect(() => {
    if (!user?.id || !q || !searched) return;
    recordWorkspaceSearch(user.id, q);
  }, [user?.id, q, searched]);

  // Keep a stable ref to the latest `search` so URL-param effect never needs
  // `search` itself as a dependency — prevents duplicate requests when the
  // useCallback reference inside useSearch changes on re-renders.
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  });

  useEffect(() => {
    searchRef.current({
      q,
      docType,
      dateFrom,
      dateTo,
      number,
      status,
      wordField,
      numberType,
      sort,
    });
  }, [q, docType, dateFrom, dateTo, number, status, wordField, numberType, sort]);

  return (
    <div className="section-pad max-w-[960px] w-full mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          searched={searched}
          query={q}
          guestPreview={isGuest}
          guestResultLimit={GUEST_VISIBLE_RESULTS_LIMIT}
        />
      </motion.div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Layout>
      <Suspense>
        <SearchResultsContent />
      </Suspense>
    </Layout>
  );
}
