import { Worker } from 'bullmq';

import { QUEUE_NAMES } from '../queue.constants.js';
import { getRedisConnection } from '../queue.connection.js';
import { analyzeLaw } from '#services/batchAnalysisService.js';

export async function processAnalyzeSubjectsJob(job) {
  const { lawId, force = false } = job.data;
  console.log(
    `[analyze_subjects] processing job ${job.id} for lawId=${lawId} (force=${force})`,
  );

  const result = await analyzeLaw(lawId, { force });

  console.log(
    `[analyze_subjects] job ${job.id} done for law ${lawId}: processed=${result.processed}, subjectsFound=${result.subjectsFound}, skipped=${result.skipped}, errors=${result.errors}`,
  );

  return result;
}

export function createAnalyzeSubjectsWorker() {
  const worker = new Worker(
    QUEUE_NAMES.ANALYZE_SUBJECTS,
    processAnalyzeSubjectsJob,
    {
      connection: getRedisConnection(),
    },
  );

  worker.on('completed', (job, result) => {
    console.log(`[analyze_subjects] job ${job.id} completed`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(
      `[analyze_subjects] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  return worker;
}
