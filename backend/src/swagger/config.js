import { schemas } from './schemas.js';

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Low Analysis API',
    version: '0.1.0',
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

### Поточний стан бази — 3 закони

| Закон | Код | Розділів | Статей |
|---|---|---|---|
| Конституція України | \`254к/96-вр\` | 14 | 166 |
| Про фінансові послуги та фінансові компанії | \`1953-20\` | 8 | 58 |
| Про ринок електричної енергії | \`2019-19\` | 19 | 98 |

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
    { name: 'Laws', description: 'Закони та їх структура' },
    { name: 'Subjects', description: "Суб'єкти регулювання" },
  ],
  components: {
    schemas,
    parameters: {
      LawId: {
        in: 'path',
        name: 'id',
        required: true,
        description: 'MongoDB ObjectId закону',
        schema: {
          type: 'string',
          example: '69f84aa7395f1789bc7b2b89',
          description:
            'Приклади: Конституція=69f84aa7395f1789bc7b2b89 · Фінпослуги=69fce97366410d6c59fd21d6 · Ринок електроенергії=69fd096aba02f877655e4e49',
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

export const swaggerCustomCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  body { background: #080F20 !important; margin: 0; }

  .swagger-ui { background: #080F20; font-family: 'DM Sans', sans-serif !important; }

  .swagger-ui .topbar {
    background: linear-gradient(135deg, #1A3E8A 0%, #0D2460 100%) !important;
    border-bottom: 2px solid rgba(200,168,67,0.4);
    padding: 12px 24px;
  }
  .swagger-ui .topbar-wrapper img,
  .swagger-ui .topbar .link { display: none !important; }
  .swagger-ui .topbar-wrapper::before {
    content: '⚖ Low Analysis API';
    color: #FFFFFF;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .swagger-ui .topbar-wrapper::after {
    content: 'Система аналізу законодавства України';
    color: #C8A843;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-left: 16px;
    font-family: 'JetBrains Mono', monospace;
  }

  .swagger-ui .information-container { background: #0D1C3A; border: 1px solid #1C3260; border-radius: 8px; margin: 20px; padding: 28px 32px; }
  .swagger-ui .info .title { color: #FFFFFF !important; font-size: 2rem !important; }
  .swagger-ui .info .title small { background: #C8A843; color: #080F20; border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; margin-left: 10px; }
  .swagger-ui .info p, .swagger-ui .info li { color: #7A98C0 !important; }
  .swagger-ui .info code { background: #142548; color: #C8A843; padding: 1px 6px; border-radius: 3px; }
  .swagger-ui .info a { color: #4A80D4 !important; }
  .swagger-ui .info pre { background: #080F20; border: 1px solid #1C3260; border-radius: 6px; padding: 12px; }

  .swagger-ui .scheme-container { background: #0D1C3A !important; border: 1px solid #1C3260; border-radius: 6px; margin: 0 20px 16px; padding: 16px 24px; box-shadow: none !important; }
  .swagger-ui .servers > label { color: #C8A843; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .swagger-ui .servers select { background: #080F20; color: #D6E0F0; border: 1px solid #1C3260; border-radius: 4px; padding: 6px 10px; }

  .swagger-ui .opblock-tag { color: #FFFFFF !important; border-color: #1C3260 !important; font-size: 1.1rem !important; background: #0D1C3A; border-radius: 6px; padding: 10px 16px; margin: 4px 20px; }
  .swagger-ui .opblock-tag:hover { background: #142548 !important; }
  .swagger-ui .opblock-tag small { color: #7A98C0 !important; }

  .swagger-ui .opblock { background: #0D1C3A !important; border: 1px solid #1C3260 !important; border-radius: 6px !important; margin: 4px 20px !important; box-shadow: none !important; }
  .swagger-ui .opblock:hover { border-color: rgba(200,168,67,0.3) !important; }

  .swagger-ui .opblock.opblock-get { border-left: 3px solid #4A80D4 !important; }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #1A3E8A !important; border-radius: 4px; }
  .swagger-ui .opblock.opblock-post { border-left: 3px solid #2D8A4E !important; }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #1A5C2E !important; border-radius: 4px; }
  .swagger-ui .opblock.opblock-delete { border-left: 3px solid #8A2D2D !important; }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #5C1A1A !important; border-radius: 4px; }

  .swagger-ui .opblock-summary { background: transparent !important; }
  .swagger-ui .opblock-summary-description { color: #D6E0F0 !important; font-size: 0.9rem; }
  .swagger-ui .opblock-summary-path { color: #A8BEDD !important; font-family: 'JetBrains Mono', monospace !important; font-size: 0.85rem !important; }
  .swagger-ui .opblock-summary-path__deprecated { color: #7A98C0 !important; }

  .swagger-ui .opblock-section-header { background: #142548 !important; border-radius: 4px; }
  .swagger-ui .opblock-section-header label { color: #C8A843 !important; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; }
  .swagger-ui .opblock-section-header h4 { color: #D6E0F0 !important; }

  .swagger-ui table { background: transparent !important; }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #C8A843 !important; border-color: #1C3260 !important; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; background: #142548; }
  .swagger-ui .parameters-col_description p { color: #A8BEDD !important; }
  .swagger-ui .parameter__name { color: #D6E0F0 !important; font-family: 'JetBrains Mono', monospace; }
  .swagger-ui .parameter__type { color: #4A80D4 !important; font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; }
  .swagger-ui .parameter__in { color: #7A98C0 !important; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; }
  .swagger-ui .parameter__deprecated { color: #8A2D2D !important; }

  .swagger-ui input, .swagger-ui textarea, .swagger-ui select { background: #080F20 !important; color: #D6E0F0 !important; border: 1px solid #1C3260 !important; border-radius: 4px !important; }
  .swagger-ui input:focus, .swagger-ui textarea:focus { border-color: #C8A843 !important; outline: none !important; }

  .swagger-ui .responses-inner { background: transparent !important; }
  .swagger-ui .response-col_status { color: #C8A843 !important; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .swagger-ui .response-col_description p { color: #A8BEDD !important; }
  .swagger-ui .response-col_links { color: #7A98C0 !important; }
  .swagger-ui .response { background: #080F20 !important; border: 1px solid #1C3260; border-radius: 4px; }

  .swagger-ui .highlight-code, .swagger-ui .microlight { background: #080F20 !important; border: 1px solid #1C3260 !important; border-radius: 4px; padding: 12px !important; }
  .swagger-ui .microlight { color: #A8BEDD !important; font-family: 'JetBrains Mono', monospace !important; font-size: 0.8rem !important; }

  .swagger-ui .btn { border-radius: 4px !important; font-family: 'DM Sans', sans-serif !important; font-weight: 500 !important; transition: all 0.2s !important; }
  .swagger-ui .btn.execute { background: #C8A843 !important; border-color: #C8A843 !important; color: #080F20 !important; font-weight: 600 !important; }
  .swagger-ui .btn.execute:hover { background: #E0BC50 !important; }
  .swagger-ui .btn.cancel { border-color: #1C3260 !important; color: #7A98C0 !important; background: transparent !important; }
  .swagger-ui .btn.try-out__btn { border-color: #C8A843 !important; color: #C8A843 !important; background: transparent !important; }
  .swagger-ui .btn.try-out__btn:hover { background: rgba(200,168,67,0.1) !important; }
  .swagger-ui .btn.authorize { border-color: #4A80D4 !important; color: #4A80D4 !important; background: rgba(74,128,212,0.1) !important; }

  .swagger-ui section.models { background: #0D1C3A !important; border: 1px solid #1C3260 !important; border-radius: 6px !important; margin: 4px 20px 20px !important; }
  .swagger-ui section.models h4 { color: #C8A843 !important; }
  .swagger-ui .model-title { color: #FFFFFF !important; }
  .swagger-ui .model { color: #A8BEDD !important; }
  .swagger-ui .model .property { color: #7A98C0 !important; }
  .swagger-ui .prop-type { color: #4A80D4 !important; font-family: 'JetBrains Mono', monospace; }
  .swagger-ui .prop-format { color: #7A98C0 !important; font-family: 'JetBrains Mono', monospace; }
  .swagger-ui .model-box { background: #080F20 !important; border: 1px solid #1C3260; border-radius: 4px; }

  .swagger-ui .arrow { fill: #C8A843 !important; }
  .swagger-ui svg.arrow { fill: #C8A843 !important; }
  .swagger-ui .markdown p, .swagger-ui .markdown li { color: #7A98C0 !important; }
  .swagger-ui .markdown h1, .swagger-ui .markdown h2, .swagger-ui .markdown h3 { color: #FFFFFF !important; }
  .swagger-ui .markdown code { background: #142548 !important; color: #C8A843 !important; padding: 2px 6px; border-radius: 3px; }
  .swagger-ui hr { border-color: #1C3260 !important; }
  .swagger-ui .loading-container { background: #080F20 !important; }
  .swagger-ui .loading-container .loading::after { color: #C8A843 !important; }
`;

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
      tryItOutEnabled: false,
    });
  };
`;
