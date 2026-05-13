"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { SearchResults } from "@/components/SearchResults";
import { useSearch } from "@/hooks/useSearch";

export default function SearchResultsPage() {
  const urlParams = useSearchParams();

  const { results, loading, error, searched, search } = useSearch();

  const q = urlParams.get("q") || "";
  const docType = urlParams.get("docType") || "";
  const dateFrom = urlParams.get("dateFrom") || "";
  const dateTo = urlParams.get("dateTo") || "";
  const number = urlParams.get("number") || "";
  const status = urlParams.get("status") || "";

  useEffect(() => {
    search({
      q,
      wordField: "title",
      docType,
      dateFrom,
      dateTo,
      numberType: "starts",
      number,
      status,
      sort: "date",
    });
  }, [q, docType, dateFrom, dateTo, number, status, search]);

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1100px] px-[clamp(14px,4vw,24px)] pt-5 pb-20 sm:pb-12">
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
          />
        </motion.div>
      </div>
    </Layout>
  );
}
