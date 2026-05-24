"use client";

import type { ParseLawResponse } from "@/types";

import { readStoredToken } from "@/lib/auth/authClient";

const API_BASE = "/api";

export async function parseLaw(url: string): Promise<ParseLawResponse> {
  const token = readStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/laws/parse`, {
    method: "POST",
    headers,
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
