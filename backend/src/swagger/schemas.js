export const schemas = {
  Law: {
    type: 'object',
    description: 'Закон або нормативний акт України',
    required: ['_id', 'title', 'code', 'createdAt'],
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
      totalParagraphs: { type: 'integer', example: 994 },
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
    required: ['_id', 'lawId', 'type', 'code', 'depth', 'order'],
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
        description: "Кількість визначених суб'єктів у цьому елементі",
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
              description: "ID суб'єкта з глобального реєстру",
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
              description: "Роль суб'єкта в контексті даного елемента",
            },
          },
        },
      },
      taxonomy: {
        type: 'object',
        nullable: true,
        description: 'Результат класифікації елемента',
        properties: {
          legalFunctions: {
            type: 'array',
            items: { type: 'string' },
            example: ['obligation', 'right'],
          },
          domains: {
            type: 'array',
            items: { type: 'string' },
            example: ['labor', 'finance'],
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            example: ['контракт', 'послуга'],
          },
          confidence: { type: 'number', example: 0.87 },
          source: {
            type: 'string',
            enum: ['rule_based', 'llm', 'manual'],
            example: 'rule_based',
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
    required: ['_id', 'canonical_name', 'legal_status'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439022' },
      canonical_name: {
        type: 'string',
        example: 'підприємець',
        description: "Канонічна назва суб'єкта в називному відмінку однини",
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
        description: "Юридичний статус суб'єкта регулювання",
      },
      aliases: {
        type: 'array',
        items: { type: 'string' },
        example: ['фоп', "суб'єкт підприємницької діяльності"],
        description: "Альтернативні назви та синоніми суб'єкта",
      },
      description: {
        type: 'string',
        example: 'Фізична особа, яка здійснює підприємницьку діяльність...',
        nullable: true,
        description: "Короткий опис суб'єкта або його функцій",
      },
      taxonomies: {
        type: 'array',
        items: { type: 'string' },
        example: ['individual', 'labor'],
        description: "Класифікаційні теги суб'єкта",
        nullable: true,
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
    required: ['data', 'pagination'],
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
    required: ['law', 'elements'],
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
    required: ['message'],
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
    required: ['totalElements', 'meanChars', 'standardDeviation', 'riskLevels'],
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
          nullCount: {
            type: 'integer',
            example: 0,
            description: 'Елементи без визначеного рівня ризику',
          },
        },
        description: 'Розподіл елементів за рівнями ризику',
      },
    },
  },

  ElementLite: {
    type: 'object',
    description:
      'Полегшена версія елемента для heatmap (без повного тексту та subjects[])',
    required: ['_id', 'type', 'code', 'depth', 'chars_count', 'risk_level'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439033' },
      type: {
        type: 'string',
        enum: ['section', 'article', 'part', 'point', 'sub_point', 'paragraph'],
      },
      code: { type: 'string', example: 'rz1.st2.ch1' },
      number: { type: 'string', nullable: true, example: '1' },
      depth: { type: 'integer', example: 2 },
      chars_count: { type: 'integer', example: 320 },
      subjects_count: { type: 'integer', example: 3 },
      z_score: { type: 'number', example: 1.8 },
      risk_level: {
        type: 'string',
        enum: ['green', 'yellow', 'red'],
        nullable: true,
        example: 'yellow',
      },
      factor: {
        type: 'integer',
        example: 54,
        description: 'Аналітичний фактор навантаження (0–100)',
      },
    },
  },

  HeatmapResponse: {
    type: 'array',
    description: 'Масив полегшених елементів для побудови теплової карти',
    items: { $ref: '#/components/schemas/ElementLite' },
  },

  User: {
    type: 'object',
    description: 'Профіль користувача',
    required: ['_id', 'email', 'fullName', 'role'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439044' },
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      fullName: { type: 'string', example: 'Іван Петренко' },
      role: {
        type: 'string',
        enum: ['user', 'paid_user', 'admin'],
        example: 'user',
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  AuthTokenResponse: {
    type: 'object',
    description: 'Відповідь після успішної реєстрації або входу',
    required: ['_id', 'email', 'fullName', 'role', 'token'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439044' },
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      fullName: { type: 'string', example: 'Іван Петренко' },
      role: {
        type: 'string',
        enum: ['user', 'paid_user', 'admin'],
        example: 'user',
      },
      token: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },

  RegisterRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      password: { type: 'string', minLength: 8, example: 'SecurePass1!' },
      displayName: {
        type: 'string',
        example: 'Іван Петренко',
        description: "Ім'я користувача (приймається і як fullName)",
      },
      fullName: {
        type: 'string',
        example: 'Іван Петренко',
        description: 'Альтернатива displayName',
      },
      accountType: {
        type: 'string',
        enum: ['client', 'admin'],
        example: 'client',
        description:
          'client — звичайний користувач, admin — потребує superCode',
      },
      superCode: {
        type: 'string',
        example: 'SUPER_SECRET',
        description: "Обов'язковий якщо accountType=admin",
      },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        example: 'user@example.com',
        description: 'Email або username',
      },
      password: { type: 'string', example: 'SecurePass1!' },
    },
  },

  UpdateProfileRequest: {
    type: 'object',
    properties: {
      displayName: {
        type: 'string',
        example: 'Новий Іван',
        description: "Нове ім'я (також приймається як fullName)",
      },
      fullName: { type: 'string', example: 'Новий Іван' },
    },
  },

  UpdatePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'nextPassword'],
    properties: {
      currentPassword: { type: 'string', example: 'OldPass1!' },
      nextPassword: {
        type: 'string',
        minLength: 8,
        example: 'NewPass1!',
        description: 'Мінімум 8 символів',
      },
    },
  },

  Taxonomy: {
    type: 'object',
    description: 'Категорія таксономії',
    required: ['_id', 'name'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439055' },
      name: { type: 'string', example: 'obligation' },
      label: { type: 'string', example: "Зобов'язання", nullable: true },
      description: { type: 'string', nullable: true },
      parentId: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  TaxonomyTreeNode: {
    type: 'object',
    description: 'Вузол ієрархії таксономії',
    required: ['_id', 'name'],
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439055' },
      name: { type: 'string', example: 'obligation' },
      label: { type: 'string', nullable: true },
      children: {
        type: 'array',
        items: { $ref: '#/components/schemas/TaxonomyTreeNode' },
        description: 'Дочірні вузли (рекурсивно)',
      },
    },
  },

  ManagedPageBlock: {
    type: 'object',
    required: ['id', 'type', 'enabled', 'data', 'style'],
    properties: {
      id: { type: 'string', example: 'hero-project-info' },
      type: {
        type: 'string',
        enum: [
          'hero',
          'richText',
          'statsGrid',
          'cards',
          'steps',
          'faq',
          'cta',
          'radioGroup',
          'quote',
          'image',
        ],
        example: 'hero',
      },
      enabled: { type: 'boolean', example: true },
      variant: { type: 'string', example: 'split', nullable: true },
      data: {
        type: 'object',
        additionalProperties: true,
        example: {
          title: 'Інформація про проєкт',
          subtitle: 'Керована block-based сторінка',
        },
      },
      style: {
        type: 'object',
        additionalProperties: true,
        example: {
          theme: 'navy-gold',
          spacingTop: 'xl',
          spacingBottom: 'lg',
        },
      },
    },
  },

  ManagedPageSnapshot: {
    type: 'object',
    required: ['title', 'blocks'],
    properties: {
      title: { type: 'string', example: 'Інформація про проєкт' },
      description: {
        type: 'string',
        example: 'Керована сторінка про платформу Low Analysis.',
      },
      seo: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Інформація про проєкт | Low Analysis',
          },
          description: {
            type: 'string',
            example: 'Опис платформи, модулів і можливостей.',
          },
          ogImage: {
            type: 'string',
            example: 'https://example.com/project-info-cover.jpg',
            nullable: true,
          },
        },
      },
      blocks: {
        type: 'array',
        items: { $ref: '#/components/schemas/ManagedPageBlock' },
      },
    },
  },

  ManagedPageVersionMeta: {
    type: 'object',
    required: ['version', 'kind', 'savedAt', 'title', 'blockCount'],
    properties: {
      version: { type: 'integer', example: 4 },
      kind: {
        type: 'string',
        enum: ['seed', 'save', 'publish', 'restore', 'unpublish'],
        example: 'publish',
      },
      savedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-26T12:15:00.000Z',
      },
      savedBy: {
        type: 'string',
        nullable: true,
        example: '507f1f77bcf86cd799439044',
      },
      title: { type: 'string', example: 'Інформація про проєкт' },
      blockCount: { type: 'integer', example: 8 },
    },
  },

  ManagedPageAdmin: {
    type: 'object',
    required: ['slug', 'title', 'status', 'draft', 'versions'],
    properties: {
      slug: { type: 'string', example: 'project-info' },
      title: { type: 'string', example: 'Інформація про проєкт' },
      status: {
        type: 'string',
        enum: ['draft', 'published'],
        example: 'published',
      },
      draft: { $ref: '#/components/schemas/ManagedPageSnapshot' },
      published: {
        oneOf: [
          { $ref: '#/components/schemas/ManagedPageSnapshot' },
          { type: 'null' },
        ],
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-26T12:30:00.000Z',
      },
      publishedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      versions: {
        type: 'array',
        items: { $ref: '#/components/schemas/ManagedPageVersionMeta' },
      },
    },
  },

  ManagedPagePublic: {
    allOf: [
      { $ref: '#/components/schemas/ManagedPageSnapshot' },
      {
        type: 'object',
        required: ['slug', 'status', 'updatedAt'],
        properties: {
          slug: { type: 'string', example: 'project-info' },
          status: {
            type: 'string',
            enum: ['published'],
            example: 'published',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-05-26T12:30:00.000Z',
          },
          publishedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },
    ],
  },

  ManagedPageCatalogItem: {
    type: 'object',
    required: ['slug', 'label'],
    properties: {
      slug: { type: 'string', example: 'project-info' },
      label: { type: 'string', example: 'Інформація про проєкт' },
    },
  },

  LawStructure: {
    type: 'object',
    description: 'Метадані закону зі списком статей',
    required: [
      'title',
      'documentType',
      'documentNumber',
      'adoptedDate',
      'signatory',
      'status',
      'articles',
    ],
    properties: {
      title: { type: 'string', example: 'КОНСТИТУЦІЯ УКРАЇНИ' },
      documentType: {
        type: 'array',
        items: { type: 'string' },
        example: ['Закон України'],
      },
      documentNumber: {
        type: 'string',
        example: '254к/96-вр',
        description: 'Офіційний код документа на zakon.rada.gov.ua',
      },
      adoptedDate: {
        type: 'string',
        format: 'date-time',
        example: '1996-06-28T00:00:00.000Z',
        nullable: true,
      },
      signatory: {
        type: 'string',
        example: 'Президент України Л.КУЧМА',
        nullable: true,
      },
      status: {
        type: 'string',
        example: 'Чинний',
        nullable: true,
      },
      articles: {
        type: 'array',
        description: 'Список статей у порядку їх появи в документі',
        items: {
          type: 'object',
          required: ['number', 'title'],
          properties: {
            number: { type: 'string', example: '1', nullable: true },
            title: { type: 'string', example: 'Стаття 1.', nullable: true },
          },
        },
      },
    },
  },

  ParseLawRequest: {
    type: 'object',
    required: ['url'],
    properties: {
      url: {
        type: 'string',
        example: 'https://zakon.rada.gov.ua/laws/show/580-19',
        description: 'URL або код закону',
      },
    },
  },

  ParseLawResponse: {
    type: 'object',
    required: ['message', 'lawId', 'elementsCount'],
    properties: {
      message: { type: 'string', example: 'Law parsed successfully' },
      lawId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      elementsCount: { type: 'integer', example: 994 },
    },
  },

  AnalyzeElementResponse: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Element analyzed' },
      elementId: { type: 'string', example: '507f1f77bcf86cd799439033' },
      subjectsFound: { type: 'integer', example: 3 },
      subjects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subject_id: { type: 'string' },
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
            },
          },
        },
      },
    },
  },

  BatchAnalyzeResponse: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Batch analysis complete' },
      lawId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      processed: { type: 'integer', example: 850 },
      subjectsFound: { type: 'integer', example: 2340 },
      skipped: { type: 'integer', example: 144 },
      errors: { type: 'integer', example: 0 },
    },
  },

  UnauthorizedError: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string', example: 'Not authorized, no token' },
    },
  },

  ForbiddenError: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string', example: 'Not authorized as admin' },
    },
  },

  ValidationError: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        example: 'Please provide email and password',
      },
    },
  },
};
