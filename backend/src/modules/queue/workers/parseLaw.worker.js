import { Worker } from 'bullmq';

import { QUEUE_NAMES } from '../queue.constants.js';
import { getRedisConnection } from '../queue.connection.js';
import { parseAndSaveLawByUrl } from '#services/lawIngest.service.js';

export async function processParseLawJob(job) {
  const { url } = job.data;
  console.log(`[parse_law] processing job ${job.id} for url=${url}`);

  const result = await parseAndSaveLawByUrl(url);

  console.log(
    `[parse_law] job ${job.id} saved law ${result.lawId} (${result.elementsCount} elements)`,
  );

  return result;
}

export function createParseLawWorker() {
  const worker = new Worker(QUEUE_NAMES.PARSE_LAW, processParseLawJob, {
    connection: getRedisConnection(),
  });

  worker.on('completed', (job, result) => {
    console.log(`[parse_law] job ${job.id} completed`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(
      `[parse_law] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  return worker;
}
