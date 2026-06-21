import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import lawRoutes from './routes/lawRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import taxonomyRoutes from './routes/taxonomyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import pageRoutes from './modules/pages/pageRoutes.js';
import pageAdminRoutes from './modules/pages/pageAdminRoutes.js';
import roadmapRoutes from './modules/roadmap/roadmap.routes.js';
import roadmapAdminRoutes from './modules/roadmap/roadmapAdminRoutes.js';
import assistantRoutes from './modules/assistant/assistant.routes.js';
import queueRoutes from './modules/queue/queue.routes.js';
import exportRoutes from './routes/exportRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import amendmentRoutes from './routes/amendmentRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import lawChangeRoutes from './routes/lawChange/index.js';
import adminRoutes from './routes/admin/index.js';
import activityRoutes from './routes/activity.js';
import notesRoutes from './routes/notesRoutes.js';
import meRoutes from './routes/meRoutes.js';
import graphRoutes from './routes/graphRoutes.js';
import graphForkRoutes from './routes/graphForkRoutes.js';
import supportRoutes from './modules/support/support.routes.js';
import billingRoutes from './routes/billingRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js';
import forkRoutes from './routes/forkRoutes.js';
import accessRequestRoutes from './routes/accessRequestRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

import {
  swaggerCustomCss,
  swaggerCustomJs,
  swaggerOptions,
} from './swagger/config.js';

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const parseOrigins = (value) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? parseOrigins(process.env.CORS_ALLOWED_ORIGINS)
  : [];

const allowedOrigins = [
  ...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]),
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const isVercelPreview =
      origin === 'https://low-analysis-frontend.vercel.app' ||
      /^https:\/\/low-analysis-frontend-[a-z0-9-]+\.vercel\.app$/.test(origin);
    if (isVercelPreview) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

const spec = swaggerJsdoc(swaggerOptions);
const app = express();

app.use(compression());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.get('/api-docs.json', (req, res) => {
    res.json(spec);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'Low Analysis API',
      customCss: swaggerCustomCss,
      customJs: swaggerCustomJs,
    }),
  );
}

app.use('/api/laws', lawRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/taxonomies', taxonomyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/admin/pages', pageAdminRoutes);
app.use('/api/admin/roadmap', roadmapAdminRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/laws/export', exportRoutes);
app.use('/api/export/dataset', exportRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/amendments', amendmentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/law-change', lawChangeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/me', meRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/graph-forks', graphForkRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/forks', forkRoutes);
app.use('/api/legislator-requests', accessRequestRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Low Analysis API is running', version: '0.1.0' });
});

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
