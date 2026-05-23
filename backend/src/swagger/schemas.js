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
      preamble: {
        type: 'string',
        example: 'Верховна Рада України від імені Українського народу...',
        nullable: true,
        description: 'Преамбула закону',
      },
      signatory: {
        type: 'string',
        example: 'Президент України Л.КУЧМА',
        nullable: true,
        description: 'Підписант закону',
      },
      status: {
        type: 'string',
        example: 'Чинний',
        nullable: true,
        description: 'Поточний статус документа',
      },
      documentType: {
        type: 'array',
        items: { type: 'string' },
        example: ['Постанова Кабінету Міністрів України', 'Порядок', 'Акт'],
        description:
          'Типи документа з блоку .doc-card на zakon.rada.gov.ua. Для простих законів — один елемент ["Закон України"]. Для складених актів — кілька: основний тип + підтипи через ";" та ",".',
      },
      source: {
        type: 'string',
        example: 'https://zakon.rada.gov.ua/laws/show/254к/96-вр',
        nullable: true,
      },
      totalArticles: { type: 'integer', example: 166 },
      totalSections: { type: 'integer', example: 14 },
      global_context: {
        type: 'object',
        description: 'Глобальний контекст закону (преамбула та визначення)',
        properties: {
          preamble: {
            type: 'string',
            example: 'Цей Закон визначає правові засади...',
            nullable: true,
          },
          definitions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string', example: 'фінансова послуга' },
                definition: {
                  type: 'string',
                  example: 'операція з фінансовими активами...',
                },
              },
            },
          },
        },
      },
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
      chars_count: {
        type: 'integer',
        example: 120,
        description: 'Кількість символів у тексті елемента',
      },
      subjects_count: {
        type: 'integer',
        example: 2,
        description: 'Кількість визначених суб’єктів у цьому елементі',
      },
      z_score: {
        type: 'number',
        example: 1.25,
        description:
          'Z-score довжини елемента відносно середнього значення по закону',
      },
      risk_level: {
        type: 'string',
        enum: ['green', 'yellow', 'red'],
        example: 'yellow',
        nullable: true,
        description: 'Рівень ризику перевантаженості абзацу',
      },
      subjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subject_id: {
              type: 'string',
              example: '507f1f77bcf86cd799439022',
              description: 'ID суб’єкта з глобального реєстру',
            },
            role: {
              type: 'string',
              enum: [
                'actor',
                'target_of_control',
                'recipient',
                'regulator',
                'protected_party',
                'issuer_of_regulations',
                'other',
              ],
              example: 'actor',
              description: 'Роль суб’єкта в контексті даного елемента',
            },
          },
        },
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
      canonical_name: {
        type: 'string',
        example: 'підприємець',
        description: 'Канонічна назва суб’єкта в називному відмінку однини',
      },
      legal_status: {
        type: 'string',
        enum: [
          'executive_body',
          'official',
          'legal_entity',
          'individual',
          'self_regulatory_org',
          'other',
        ],
        example: 'individual',
        description: 'Юридичний статус суб’єкта регулювання',
      },
      aliases: {
        type: 'array',
        items: { type: 'string' },
        example: ['фоп', "суб'єкт підприємницької діяльності"],
        description: 'Альтернативні назви та синоніми суб’єкта',
      },
      description: {
        type: 'string',
        example: 'Фізична особа, яка здійснює підприємницьку діяльність...',
        nullable: true,
        description: 'Короткий опис суб’єкта або його функцій',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-13T02:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-13T02:30:00.000Z',
      },
    },
  },

  PaginatedLaws: {
    type: 'object',
    description: 'Пагінований список законів',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Law' },
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 150 },
          totalPages: { type: 'integer', example: 8 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
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
      lawUrl: {
        type: 'string',
        nullable: true,
        example: 'https://zakon.rada.gov.ua/laws/show/580-19#Text',
        description: 'Посилання на повний текст закону',
      },
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

  LawStats: {
    type: 'object',
    description: 'Статистика закону та його елементів',
    properties: {
      totalElements: {
        type: 'integer',
        example: 994,
        description: 'Загальна кількість елементів закону',
      },
      meanChars: {
        type: 'number',
        example: 160.45,
        description: 'Середня довжина елементів у символах',
      },
      standardDeviation: {
        type: 'number',
        example: 140.12,
        description: 'Стандартне відхилення довжини елементів',
      },
      riskLevels: {
        type: 'object',
        properties: {
          green: { type: 'integer', example: 850 },
          yellow: { type: 'integer', example: 110 },
          red: { type: 'integer', example: 34 },
          null: { type: 'integer', example: 0 },
        },
        description: 'Розподіл елементів за рівнями ризику',
      },
    },
  },
};
