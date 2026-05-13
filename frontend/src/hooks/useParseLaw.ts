"use client";

import { useState } from "react";
import { parseLaw } from "@/lib/api";

export function useParseLaw(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      await parseLaw(url);

      onSuccess?.();
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Не вдалося додати закон",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    error,
  };
}
