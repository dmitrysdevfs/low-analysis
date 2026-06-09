import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://84bde31b75fcf05e4000b660ef3a18b4@o4511532554518528.ingest.de.sentry.io/4511532563693648",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});
