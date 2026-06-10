import { Worker } from 'bullmq';

import { QUEUE_NAMES } from '../queue.constants.js';
import { getRedisConnection } from '../queue.connection.js';
import { batchUpdateLawTrees } from '#services/lawIngest.service.js';

export async function processBatchUpdateLawTreeJob(job) {
  const { codes } = job.data;
  console.log(
    `[batch_update_law_tree] processing job ${job.id} for ${codes.length} law(s)`,
  );

  const result = await batchUpdateLawTrees(codes);

  console.log(
    `[batch_update_law_tree] job ${job.id} done: updated=${result.updated}, failed=${result.failed}, total=${result.total}`,
  );

  return result;
}

export function createBatchUpdateLawTreeWorker() {
  const worker = new Worker(
    QUEUE_NAMES.BATCH_UPDATE_LAW_TREE,
    processBatchUpdateLawTreeJob,
    {
      connection: getRedisConnection(),
    },
  );

  worker.on('completed', (job, result) => {
    console.log(`[batch_update_law_tree] job ${job.id} completed`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(
      `[batch_update_law_tree] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  return worker;
}
