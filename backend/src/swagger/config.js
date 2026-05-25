import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require('../../../package.json');

import { schemas } from './schemas.js';

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Low Analysis API',
    version: pkg.version,
    description: `
## Система структурування та аналізу українського законодавства

Перетворення лінійних текстів законів на ієрархічну базу атомарних елементів.

### Ієрархія елементів
\`\`\`
Закон
 └─ Розділ  (section)   depth: 0   code: rz1
     └─ Стаття (article) depth: 1   code: rz1.st2
         └─ Частина (part) depth: 2   code: rz1.st2.ch1
\`\`\`

### Авторизація

1. Зареєструйтесь через \`POST /api/auth/register\` або увійдіть через \`POST /api/auth/login\`
2. Скопіюйте поле \`token\` з відповіді
3. Натисніть кнопку **Authorize** (🔒) вгорі сторінки
4. Вставте токен у форматі: \`Bearer <token>\`

### Пошук

\`GET /api/laws?q=конституція\` — фільтрація за назвою (регістронезалежний MongoDB regex)
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
    { url: 'https://low-analysis.onrender.com', description: 'Продакшн' },
    { url: 'http://localhost:3000', description: 'Локальна розробка' },
  ],
  tags: [
    { name: 'Health', description: 'Стан сервера' },
    { name: 'Auth', description: 'Автентифікація та управління акаунтом' },
    { name: 'Laws', description: 'Закони та їх структура' },
    { name: 'Elements', description: 'Атомарні елементи законів' },
    { name: 'Subjects', description: "Суб'єкти регулювання" },
    { name: 'Taxonomy', description: 'Класифікація та таксономія норм' },
  ],
  components: {
    schemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT токен отриманий після логіну. Формат: Bearer <token>',
      },
    },
    responses: {
      ServerError: {
        description: 'Внутрішня помилка сервера',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Internal server error' },
          },
        },
      },
      Unauthorized: {
        description: 'Не авторизовано — JWT токен відсутній або недійсний',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Not authorized, no token' },
          },
        },
      },
      Forbidden: {
        description: 'Доступ заборонено — недостатньо прав',
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
        description: 'MongoDB ObjectId закону',
        schema: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
      ArticleNum: {
        in: 'path',
        name: 'num',
        required: true,
        description: 'Номер статті (рядок, напр. "1", "129-1")',
        schema: { type: 'string', example: '1' },
      },
      SubjectId: {
        in: 'path',
        name: 'id',
        required: true,
        description: "MongoDB ObjectId суб'єкта",
        schema: { type: 'string', example: '507f1f77bcf86cd799439022' },
      },
    },
  },
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.js'],
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
