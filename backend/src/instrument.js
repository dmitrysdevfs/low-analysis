import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Tracing
  tracesSampleRate: 1.0,

  // Profiling
  profilesSampleRate: 1.0,

  // Logs
  _experiments: { enableLogs: true },

  integrations: [nodeProfilingIntegration()],
});
