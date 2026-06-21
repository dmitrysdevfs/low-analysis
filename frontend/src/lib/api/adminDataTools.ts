"use client";

import { requestJson } from "./_client";

export type ParseSingleReferencesResult = {
  parsed: number;
  created: number;
  updated: number;
};

export type ParseAllReferencesResult = {
  laws: number;
  totalParsed: number;
  totalCreated: number;
  totalUpdated: number;
  results: Array<{
    lawId: string;
    parsed: number;
    created: number;
    updated: number;
  }>;
};

export const adminDataToolsApi = {
  parseAllReferences: () =>
    requestJson<ParseAllReferencesResult>(
      "/admin/parse-references/all",
      "POST",
    ),

  parseSingleLawReferences: (lawId: string) =>
    requestJson<ParseSingleReferencesResult>(
      `/admin/parse-references/law/${encodeURIComponent(lawId)}`,
      "POST",
    ),
};
