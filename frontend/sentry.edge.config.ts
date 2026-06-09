import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2e0c2f772e549be2c37e1271350017e2@o4511532554518528.ingest.de.sentry.io/4511532604719184",
  tracesSampleRate: 1.0,
});
