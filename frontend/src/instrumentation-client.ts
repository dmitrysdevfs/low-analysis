import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: "https://2e0c2f772e549be2c37e1271350017e2@o4511532554518528.ingest.de.sentry.io/4511532604719184",

  // Tracing
  tracesSampleRate: 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Logs
  _experiments: { enableLogs: true },

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ["error", "warn"] }),
  ],
});
