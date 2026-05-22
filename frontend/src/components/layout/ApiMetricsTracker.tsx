"use client";

import { useEffect } from "react";
import { installFetchInterceptor } from "@/lib/apiMetrics/interceptor";

export function ApiMetricsTracker() {
  useEffect(() => {
    installFetchInterceptor();
  }, []);
  return null;
}
