'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { SearchResults } from '@/components/SearchResults';
import { useSearch } from '@/hooks/useSearch';

function SearchResultsContent() {
  const urlParams = useSearchParams();
  const { results, loading, error, searched, search } = useSearch();

  const q = urlParams.get('q') || '';
  const docType = urlParams.get('docType') || '';
  const dateFrom = urlParams.get('dateFrom') || '';
  const dateTo = urlParams.get('dateTo') || '';
  const number = urlParams.get('number') || '';
  const status = urlParams.get('status') || '';

  useEffect(() => {
    search({
      q,
      docType,
      dateFrom,
      dateTo,
      number,
      status,
      wordField: 'title',
      numberType: 'starts',
      sort: 'date',
    });
  }, [q, docType, dateFrom, dateTo, number, status, search]);

  return (
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
