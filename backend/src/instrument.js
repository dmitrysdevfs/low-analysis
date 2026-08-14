import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const environment = process.env.NODE_ENV || 'development';

// У dev відправка вимкнена: помилки з локальної машини інакше течуть у той
// самий проєкт, що й продакшн, і стрічку стає неможливо читати. Семплінг тут
// не рятує — він керує лише трейсами й профілями, а помилки Sentry шле завжди.
// Щоб перевірити саму інтеграцію локально, достатньо SENTRY_ENABLED=true.
const enabled =
  process.env.SENTRY_ENABLED !== undefined
    ? process.env.SENTRY_ENABLED === 'true'
    : environment !== 'development' && environment !== 'test';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment,
  enabled,

  // Tracing
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : 1.0,

  // Profiling
  profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
    ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
    : 1.0,

  // Logs
  _experiments: { enableLogs: true },

  integrations: [nodeProfilingIntegration()],
});
