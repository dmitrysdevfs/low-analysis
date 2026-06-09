import { QUEUE_NAMES } from './queue.constants.js';
import { getQueue } from './queue.client.js';

export async function enqueueParseLaw(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'URL or law code is required' });
    }

    const job = await getQueue(QUEUE_NAMES.PARSE_LAW).add(
      QUEUE_NAMES.PARSE_LAW,
      {
        url,
      },
    );

    return res.status(202).json({
      jobId: job.id,
      queue: QUEUE_NAMES.PARSE_LAW,
      state: 'queued',
    });
  } catch (error) {
    next(error);
  }
}

export async function enqueueAnalyzeSubjects(req, res, next) {
  try {
    const { lawId, force = false } = req.body;
    if (!lawId) {
      return res.status(400).json({ message: 'lawId is required' });
    }

    const job = await getQueue(QUEUE_NAMES.ANALYZE_SUBJECTS).add(
      QUEUE_NAMES.ANALYZE_SUBJECTS,
      {
        lawId,
        force,
      },
    );

    return res.status(202).json({
      jobId: job.id,
      queue: QUEUE_NAMES.ANALYZE_SUBJECTS,
      state: 'queued',
    });
  } catch (error) {
    next(error);
  }
}

async function findJob(jobId) {
  for (const queueName of Object.values(QUEUE_NAMES)) {
    const job = await getQueue(queueName).getJob(jobId);
    if (job) return { job, queue: queueName };
  }
  return null;
}

export async function getJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;

    const found = await findJob(jobId);
    if (!found) {
      return res.status(404).json({ message: `Job not found: ${jobId}` });
    }

    const { job, queue } = found;
    const state = await job.getState();

    return res.json({
      jobId: job.id,
      queue,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      returnvalue: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    });
  } catch (error) {
    next(error);
  }
}
