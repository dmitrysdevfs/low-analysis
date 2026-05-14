"use client";

import { useEffect, useState } from "react";
import { getSubjects } from "@/lib/api";
/**
 * Хук для завантаження всіх суб'єктів з API та повернення їх у вигляді Map для швидкого пошуку за ID.
 * @returns {{subjectsMap: Map<string, Subject>, loading: boolean}} Об'єкт, що містить мапу суб'єктів та статус завантаження.
 */
export function useSubjectsMap(): {
  subjectsMap: Map<string, Subject>;
  loading: boolean;
} {

export function useSubjectsMap(): {
  subjectsMap: Map<string, Subject>;
  loading: boolean;
} {
  const [subjectsMap, setSubjectsMap] = useState<Map<string, Subject>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubjects()
      .then((subjects) => {
        const map = new Map<string, Subject>(subjects.map((s) => [s._id, s]));
        setSubjectsMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { subjectsMap, loading };
}
