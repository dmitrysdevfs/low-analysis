import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import lawRoutes from './routes/lawRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
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
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

const spec = swaggerJsdoc(swaggerOptions);
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

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

app.use('/api/laws', lawRoutes);
app.use('/api/subjects', subjectRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Low Analysis API is running', version: '0.1.0' });
});

app.use(errorHandler);

export default app;
