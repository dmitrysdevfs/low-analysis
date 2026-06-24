"use client";

import { getJson, requestJson } from "./_client";

export type QueueJobState =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | string;

export type QueueEnqueueResponse = {
  jobId: string;
  queue: string;
  state: string;
};

export type QueueJobStatus = {
  jobId: string;
  queue: string;
  state: QueueJobState;
  progress: unknown;
  attemptsMade: number;
  returnvalue: unknown | null;
  failedReason: string | null;
};

export const queueApi = {
  enqueueParseLaw: (url: string) =>
    requestJson<QueueEnqueueResponse>("/queue/parse-law", "POST", { url }),

  enqueueAnalyzeSubjects: (lawId: string, force = false) =>
    requestJson<QueueEnqueueResponse>("/queue/analyze-subjects", "POST", {
      lawId,
      force,
    }),

  enqueueBatchUpdateLawTree: (codes: string[]) =>
    requestJson<QueueEnqueueResponse>("/queue/batch-update-law-tree", "POST", {
      codes,
    }),

  getJobStatus: (jobId: string) =>
    getJson<QueueJobStatus>(`/queue/status/${encodeURIComponent(jobId)}`),
};
