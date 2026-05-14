"use client";

import { useEffect, useState } from "react";
import { getSubjects } from "@/lib/api";
import type { Subject } from "@/types";

/**
 * Хук для завантаження всіх суб'єктів з API та повернення їх у вигляді Map для швидкого пошуку за ID.
 * @returns {{subjectsMap: Map<string, Subject>, loading: boolean, error: string | null}} Об'єкт, що містить мапу суб'єктів та статус завантаження.
 */
export function useSubjectsMap(): {
  subjectsMap: Map<string, Subject>;
  loading: boolean;
  error: string | null;
} {
  const [subjectsMap, setSubjectsMap] = useState<Map<string, Subject>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubjects()
      .then((subjects) => {
        const map = new Map<string, Subject>(subjects.map((s) => [s._id, s]));
        setSubjectsMap(map);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch subjects:", err);
        setError(err instanceof Error ? err.message : "Невідома помилка");
      })
      .finally(() => setLoading(false));
  }, []);

  return { subjectsMap, loading, error };
}
