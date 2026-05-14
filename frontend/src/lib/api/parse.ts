"use client";

import type { ParseLawResponse } from "@/types";

const API_BASE = "/api";

export async function parseLaw(url: string): Promise<ParseLawResponse> {
  const res = await fetch(`${API_BASE}/laws/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;

    try {
      const errorBody = await res.json();

      if (
        errorBody &&
        typeof errorBody === "object" &&
        "message" in errorBody
      ) {
        errorMessage = String(errorBody.message);
      }
    } catch {
      // ignore json parse errors
    }

    throw new Error(errorMessage);
  }

  return res.json() as Promise<ParseLawResponse>;
}
