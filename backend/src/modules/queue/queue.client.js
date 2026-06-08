import { Queue } from 'bullmq';

import { QUEUE_NAMES } from './queue.constants.js';
import { getRedisConnection } from './queue.connection.js';

const BASE_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

const QUEUE_JOB_OPTIONS = {
  [QUEUE_NAMES.PARSE_LAW]: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10_000 },
  },
};

const queues = new Map();

export function getQueue(name) {
  if (!Object.values(QUEUE_NAMES).includes(name)) {
    throw new Error(
      `Unknown queue: ${name}. Valid: ${Object.values(QUEUE_NAMES).join(', ')}`,
    );
  }

  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        ...BASE_JOB_OPTIONS,
        ...(QUEUE_JOB_OPTIONS[name] ?? {}),
      },
    });
    queues.set(name, queue);
  }

  return queue;
}

export async function closeQueues() {
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  queues.clear();
}
