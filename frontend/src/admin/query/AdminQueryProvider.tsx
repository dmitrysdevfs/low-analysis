"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, type ReactNode } from "react";

export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
