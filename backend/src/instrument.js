import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: 'https://bee8f789a738550040709ae2a6215689@o4511532554518528.ingest.de.sentry.io/4511532614549584',

  // Tracing
  tracesSampleRate: 1.0,

  // Profiling
  profilesSampleRate: 1.0,

  // Logs
  _experiments: { enableLogs: true },

  integrations: [
    nodeProfilingIntegration(),
  ],
});
