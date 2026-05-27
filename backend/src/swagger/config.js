import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

import { schemas } from './schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require('../../../package.json');

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Low Analysis API',
    version: pkg.version,
    description: `
## Low Analysis API

API for parsing, structuring and analysing Ukrainian legislation.

### Core areas
- laws catalogue and metadata
- tree of atomic elements for every law
- article and element drill-down
- statistics and heatmap datasets
- subjects and taxonomy
- managed public pages for the project site

### Authentication
1. Register via \`POST /api/auth/register\` or login via \`POST /api/auth/login\`
2. Copy the \`token\` field from the response
3. Click **Authorize** in Swagger UI
4. Paste the token as \`Bearer <token>\`

### Search note
\`GET /api/laws?q=...\` currently filters by title on the backend.
    `,
    contact: {
      name: 'Low Analysis',
      url: 'https://github.com/dmitrysdevfs/low-analysis',
    },
    license: {
      name: 'ISC',
    },
  },
  servers: [
    { url: 'https://low-analysis.onrender.com', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'Server health and readiness' },
    { name: 'Auth', description: 'Authentication and account management' },
    {
      name: 'Laws',
      description: 'Laws, tree data, articles, stats and parsing',
    },
    { name: 'Elements', description: 'Atomic law elements' },
    {
      name: 'Subjects',
      description: 'Regulatory subjects and related elements',
    },
    { name: 'Taxonomy', description: 'Taxonomy categories and classification' },
    { name: 'Pages', description: 'Managed public pages and page builder API' },
    { name: 'Roadmap', description: 'Публічний roadmap і адмін-редагування' },
    {
      name: 'Assistant',
      description: 'Lex AI Помічник — чат, сесії, квота, фідбек',
    },
  ],
  components: {
    schemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token received after login. Format: Bearer <token>',
      },
    },
    responses: {
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Internal server error' },
          },
        },
      },
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Not authorized, no token' },
          },
        },
      },
      Forbidden: {
        description: 'Authenticated, but without required role',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Not authorized as admin' },
          },
        },
      },
    },
    parameters: {
      LawId: {
        in: 'path',
        name: 'id',
        required: true,
        description: 'MongoDB ObjectId of the law',
        schema: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
      ArticleNum: {
        in: 'path',
        name: 'num',
        required: true,
        description: 'Article number as string, for example "1" or "129-1"',
        schema: { type: 'string', example: '1' },
      },
      SubjectId: {
        in: 'path',
        name: 'id',
        required: true,
        description: 'MongoDB ObjectId of the subject',
        schema: { type: 'string', example: '507f1f77bcf86cd799439022' },
      },
    },
  },
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/modules/pages/*.js',
    './src/modules/roadmap/*.js',
    './src/modules/assistant/*.js',
  ],
};

export const swaggerCustomCss = readFileSync(
  join(__dirname, 'swagger.css'),
  'utf-8',
);

export const swaggerCustomJs = `
  window.onload = () => {
    window.ui = SwaggerUIBundle({
      url: '/api-docs.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
    });
  };
`;
