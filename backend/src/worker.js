import '#bootstrap/loadEnv.js';

const { default: connectDB } = await import('#config/db.js');
const { createParseLawWorker } =
  await import('#modules/queue/workers/parseLaw.worker.js');
const { createAnalyzeSubjectsWorker } =
  await import('#modules/queue/workers/analyzeSubjects.worker.js');
const { createBatchUpdateLawTreeWorker } =
  await import('#modules/queue/workers/batchUpdateLawTree.worker.js');

const startWorker = async () => {
  await connectDB();

  const workers = [
    createParseLawWorker(),
    createAnalyzeSubjectsWorker(),
    createBatchUpdateLawTreeWorker(),
  ];

  console.log(`[worker] started ${workers.length} worker(s), waiting for jobs`);

  const shutdown = async (signal) => {
    console.log(`[worker] received ${signal}, shutting down...`);
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startWorker().catch((error) => {
  console.error(`[worker] fatal: ${error.message}`);
  process.exit(1);
});
