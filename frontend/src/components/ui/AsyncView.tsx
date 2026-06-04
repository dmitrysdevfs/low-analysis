import type { ReactNode } from "react";

interface AsyncViewProps<T> {
  loading: boolean;
  error: string | null;
  data: T | null | undefined;
  loadingFallback?: ReactNode;
  errorFallback?: (error: string) => ReactNode;
  children: (data: T) => ReactNode;
}

export function AsyncView<T>({
  loading,
  error,
  data,
  loadingFallback,
  errorFallback,
  children,
}: AsyncViewProps<T>) {
  if (loading) return loadingFallback ?? null;
  if (error)
    return errorFallback ? (
      errorFallback(error)
    ) : (
      <p style={{ color: "#c7d5ea" }}>{error}</p>
    );
  if (data == null) return null;
  return children(data);
}
