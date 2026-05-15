"use client";

import { useState } from "react";
import { parseLaw } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import { notify } from "@/lib/toast";

export function useParseLaw(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      await parseLaw(url);

      notify.success("Закон успішно додано!");
      onSuccess?.();
    } catch (err: unknown) {
      const msg = parseApiError(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}
