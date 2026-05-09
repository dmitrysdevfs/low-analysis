export const schemas = {
  Law: {
    type: 'object',
    description: 'Закон або нормативний акт України',
    properties: {
      _id: { type: 'string', example: '69f84aa7395f1789bc7b2b89' },
      title: { type: 'string', example: 'КОНСТИТУЦІЯ УКРАЇНИ' },
      code: {
        type: 'string',
        example: '254к/96-вр',
        description: 'Унікальний код документа на zakon.rada.gov.ua',
      },
      adoptedDate: {
        type: 'string',
        format: 'date-time',
        example: '1996-06-28T00:00:00.000Z',
        nullable: true,
      },
      source: {
        type: 'string',
        example: 'https://zakon.rada.gov.ua/laws/show/254к/96-вр',
        nullable: true,
      },
      totalArticles: { type: 'integer', example: 166 },
      totalSections: { type: 'integer', example: 14 },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-04T07:28:39.674Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-04T07:28:40.230Z',
      },
    },
  },

  Element: {
    type: 'object',
    description:
      'Атомарний елемент закону (розділ, стаття, частина, пункт, підпункт, абзац)',
    properties: {
      _id: { type: 'string', example: '69f84aa7395f1789bc7b2b8a' },
      lawId: {
        type: 'string',
        example: '69f84aa7395f1789bc7b2b89',
        description: 'ID закону, якому належить елемент',
      },
      type: {
        type: 'string',
        enum: ['section', 'article', 'part', 'point', 'sub_point', 'paragraph'],
        example: 'article',
      },
      code: {
        type: 'string',
        example: 'rz1.st2',
        description: 'Ієрархічний код елемента',
      },
      number: { type: 'string', example: '2', nullable: true },
      title: { type: 'string', example: 'Стаття 2.', nullable: true },
      text: {
        type: 'string',
        example: 'Суверенітет України поширюється на всю її територію.',
        nullable: true,
      },
      parentId: {
        type: 'string',
        example: '69f84aa7395f1789bc7b2b8a',
        nullable: true,
        description: 'ID батьківського елемента',
      },
      depth: {
        type: 'integer',
        example: 1,
        description: '0=розділ, 1=стаття, 2=частина/абзац',
      },
      order: {
        type: 'integer',
        example: 2,
        description: 'Порядковий номер у межах батьківського елемента',
      },
      subjects: {
        type: 'array',
        items: { type: 'string' },
        example: [],
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-04T07:28:39.798Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-04T07:28:39.798Z',
      },
    },
  },

  Subject: {
    type: 'object',
    description: "Суб'єкт регулювання (студент, лікар, підприємець тощо)",
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439022' },
      name: { type: 'string', example: 'Підприємець' },
      aliases: {
        type: 'array',
        items: { type: 'string' },
        example: ['ФОП', "суб'єкт підприємницької діяльності"],
      },
      elementIds: {
        type: 'array',
        items: { type: 'string' },
        description: "ID елементів, що регулюють цього суб'єкта",
      },
      lawIds: {
        type: 'array',
        items: { type: 'string' },
        description: "ID законів, що стосуються суб'єкта",
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  LawTree: {
    type: 'object',
    description: 'Закон із повним плоским деревом елементів',
    properties: {
      law: { $ref: '#/components/schemas/Law' },
      elements: {
        type: 'array',
        items: { $ref: '#/components/schemas/Element' },
        description:
          'Плоский масив елементів, відсортований за depth та order. Клієнт будує ієрархію самостійно.',
      },
    },
  },

  Article: {
    type: 'object',
    description: 'Стаття з дочірніми елементами',
    properties: {
      article: { $ref: '#/components/schemas/Element' },
      children: {
        type: 'array',
        items: { $ref: '#/components/schemas/Element' },
        description: 'Частини, пункти, підпункти та абзаци цієї статті',
      },
    },
  },

  SubjectElements: {
    type: 'object',
    description: "Суб'єкт із пов'язаними елементами законів",
    properties: {
      subject: { $ref: '#/components/schemas/Subject' },
      elements: {
        type: 'array',
        items: { $ref: '#/components/schemas/Element' },
      },
    },
  },

  Error: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Law not found' },
      stack: {
        type: 'string',
        nullable: true,
        description: 'Stack trace (тільки в dev режимі)',
      },
    },
  },

  HealthCheck: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Low Analysis API is running' },
      version: { type: 'string', example: '0.1.0' },
    },
  },
};
