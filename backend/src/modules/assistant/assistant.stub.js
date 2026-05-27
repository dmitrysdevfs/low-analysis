// Inline FAQ knowledge base for stub mode (no LLM required)
const FAQ_KB = [
  {
    keywords: ['пошук', 'знайти', 'знайти закон', 'як шукати', 'назва', 'код'],
    question: 'Як знайти закон за назвою або кодом?',
    answer:
      'Введіть назву або скорочений код (наприклад «КУ» для Конституції) у рядок пошуку. Натисніть «/» для швидкого фокусу поля пошуку.',
    href: '/help/how-to-search',
    category: 'Пошук',
  },
  {
    keywords: ['фільтр', 'тип', 'дата', 'статус', 'фільтрувати'],
    question: 'Як фільтрувати результати за типом, датою або статусом?',
    answer:
      'Розгорніть блок фільтрів на сторінці пошуку і оберіть потрібний тип документа, діапазон дат або статус (чинний / скасований).',
    href: '/help/how-to-search',
    category: 'Фільтри',
  },
  {
    keywords: ['ліміт', 'обмеження', 'скільки', 'результат', 'гість', 'гостей'],
    question: 'Чому я бачу лише перші результати пошуку?',
    answer:
      'Гостям без реєстрації доступні перші 12 результатів пошуку та 10 детальних переглядів. Зареєструйтесь або активуйте план для повного доступу.',
    href: '/help/how-to-guest-limits',
    category: 'Ліміти',
  },
  {
    keywords: ['закон', 'каталог', 'перелік', 'список законів', 'переглянути'],
    question: 'Як відкрити каталог законів?',
    answer:
      'Перейдіть до розділу «Закони» через верхнє меню. Ви можете фільтрувати за статусом (чинний / скасований) і шукати за назвою.',
    href: '/help/how-to-laws-page',
    category: 'Закони',
  },
  {
    keywords: ['стаття', 'статті', 'пункт', 'абзац', 'ієрархія'],
    question: 'Як читати ієрархію пунктів і абзаців у статті?',
    answer:
      'Кожен елемент має значок типу (п., абз.), лічильник символів та крапку ризику (зелена/жовта/червона відповідає обсягу тексту). Рівні вкладення відображаються відступом.',
    href: '/help/how-to-article-page',
    category: 'Статті',
  },
  {
    keywords: ['ризик', 'колір', 'зелений', 'жовтий', 'червоний', 'складність'],
    question: 'Що означають кольори ризику (зелений / жовтий / червоний)?',
    answer:
      'Зелений — коротка стаття (норма), жовтий — помірний обсяг, червоний — великий текст підвищеної уваги. Клікніть на сегмент смуги ризику, щоб відфільтрувати статті.',
    href: '/help/how-to-risk-filter',
    category: 'Фільтри',
  },
  {
    keywords: ['суб\'єкт', 'суб\'єкти', 'регулятор', 'орган', 'особа'],
    question: 'Що таке суб\'єкт регулювання?',
    answer:
      'Суб\'єкт — особа, організація або орган, яких стосується норма закону. Синій чіп — регулятор, зелений — підрегульований суб\'єкт, золотий — інша роль.',
    href: '/help/how-to-subjects',
    category: 'Суб\'єкти',
  },
  {
    keywords: ['нотатка', 'нотатки', 'зберегти', 'виділити', 'highlight'],
    question: 'Як зберегти нотатку до фрагмента тексту?',
    answer:
      'Виділіть потрібний текст мишею, потім натисніть «📝 Зберегти в нотатки». Всі збережені нотатки доступні в розділі Мій кабінет → Нотатки.',
    href: '/help/how-to-notes',
    category: 'Нотатки',
  },
  {
    keywords: ['акаунт', 'реєстрація', 'увійти', 'логін', 'пароль', 'зареєструватись'],
    question: 'Як зареєструватися або увійти?',
    answer:
      'Натисніть «Вхід» у верхньому меню. Форми реєстрації та входу розташовані на одній сторінці. Після реєстрації знімаються гостьові ліміти.',
    href: '/help/how-to-account',
    category: 'Акаунт',
  },
  {
    keywords: ['план', 'оплата', 'підписка', 'білінг', 'тариф', 'ціна'],
    question: 'Які плани доступні?',
    answer:
      'Стартер ($1 / 7 днів), Базовий ($9 / місяць), Розширений ($19 / місяць), Про ($39 / місяць — необмежено). Перейдіть до Мій кабінет → План та оплата для деталей.',
    href: '/account/billing',
    category: 'Акаунт',
  },
  {
    keywords: ['цитата', 'скопіювати', 'копіювати', 'посилання на пункт'],
    question: 'Як скопіювати цитату з пункту?',
    answer:
      'Натисніть кнопку «⧉» поруч із елементом — скопіюється текст разом з назвою закону та суб\'єктами. Кожен елемент також має унікальний якір (#код) для прямого посилання.',
    href: '/help/how-to-copy',
    category: 'Статті',
  },
  {
    keywords: ['аналіз', 'аналізувати', 'lex', 'ai', 'асистент', 'помічник'],
    question: 'Як використовувати AI-помічника?',
    answer:
      'Lex — AI Помічник доступний на сторінках законів через плаваючу кнопку або через повну сторінку /assistant. Ставте запитання про конкретний закон або загальні питання законодавства.',
    href: '/assistant',
    category: 'AI',
  },
];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^а-яёіїєa-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreItem(item, queryTokens) {
  let score = 0;
  for (const token of queryTokens) {
    for (const keyword of item.keywords) {
      if (keyword.includes(token) || token.includes(keyword)) score += 2;
      else if (keyword.startsWith(token.slice(0, 3))) score += 1;
    }
  }
  return score;
}

/**
 * Match a user message against the FAQ knowledge base.
 * @param {string} message
 * @returns {{ item: object, score: number }[]} sorted by relevance
 */
export function matchFaq(message) {
  const tokens = tokenize(message);
  if (tokens.length === 0) return [];

  return FAQ_KB.map((item) => ({ item, score: scoreItem(item, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Generate a stub response for the given user message.
 * @param {string} message
 * @param {{ lawId?: string, articleNum?: string }} context
 * @returns {{ content: string, sources: Array }}
 */
export function generateStubResponse(message, context = {}) {
  const matches = matchFaq(message);

  if (matches.length === 0) {
    const fallback =
      'Я — Lex, AI Помічник платформи Law Analysis. ' +
      'Я можу відповісти на запитання про пошук законів, статті, фільтри, нотатки, акаунт та плани. ' +
      'Спробуйте запитати, наприклад: «Як знайти закон?» або «Що означає червоний ризик?»';

    if (context.lawId) {
      return {
        content: `${fallback}\n\nЗараз відкритий закон ${context.lawId}${context.articleNum ? `, стаття ${context.articleNum}` : ''}. Якщо у вас є конкретне запитання про цей документ — уточніть його.`,
        sources: [],
      };
    }

    return { content: fallback, sources: [] };
  }

  const best = matches[0];
  const intro =
    matches.length === 1
      ? `Ось що я знайшов по вашому запиту:`
      : `Ось кілька відповідних тем:`;

  let content = `${intro}\n\n**${best.item.question}**\n${best.item.answer}`;

  if (matches.length > 1) {
    content += '\n\n**Також може бути корисним:**';
    for (const { item } of matches.slice(1)) {
      content += `\n— ${item.question}: ${item.answer}`;
    }
  }

  content +=
    '\n\n_Якщо відповідь не повна — задайте уточнювальне запитання або перейдіть до довідки._';

  const sources = matches.map(({ item }) => ({
    title: item.question,
    href: item.href,
    type: 'faq',
  }));

  return { content, sources };
}
