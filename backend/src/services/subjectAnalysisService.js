import Element from '../models/Element.js';
import Law from '../models/Law.js';
import { queryLLM } from './llmService.js';
import { ensureSubjectExists } from './subjectRepository.js';

// ── Prompt Template ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Ти — експерт з юридичної лінгвістики та структурованих даних.
Твоє завдання — Semantic Role Labeling (SRL) для текстів українського законодавства.

Тобі буде надано:
1. [GLOBAL_CONTEXT] — назва закону, преамбула та визначення термінів зі Статті 1.
2. [LOCAL_CONTEXT] — текст конкретного структурного елемента закону.

Алгоритм аналізу (виконай покроково):
1. Визнач усі іменникові групи в LOCAL_CONTEXT, що позначають суб'єктів. Обов'язково проаналізуй відмінок іменника та його залежність від дієслів чи інших іменників (наприклад, якщо суб'єкт стоїть у родовому/знахідному відмінку "нагляд за діяльністю осіб", він є об'єктом процесу, а не його виконавцем).
2. Уточни природу кожного суб'єкта, використовуючи визначення з GLOBAL_CONTEXT.
3. Приведи назву суб'єкта до **називного відмінку** (канонічна форма).
4. ІГНОРУЙ назви законів, кодексів та нормативних актів — це посилання на документи, НЕ суб'єкти.
5. ІГНОРУЙ абстрактні поняття ("ліцензія", "дозвіл") — це об'єкти, а не актори.
6. Класифікуй legal_status кожного суб'єкта:
   - executive_body: Кабмін, НБУ, НКЦПФР, міністерства, служби, агентства
   - official: Президент, Уповноважений, Голова, посадова особа
   - legal_entity: підприємство, фінансова установа, організація
   - individual: фізична особа, громадянин, споживач, клієнт
   - self_regulatory_org: саморегулівна організація
   - other: якщо не підходить жодна з категорій
7. Визнач роль суб'єкта в нормі:
   - actor: активний виконавець дії, носій безпосереднього обов'язку у поточному реченні (стоїть у називному відмінку: "суб'єкт подає", "установа зобов'язана").
   - target_of_control: суб'єкт, щодо якого здійснюється державне регулювання, нагляд, перевірка чи санкції у поточному тексті (наприклад, "перевірка афілійованих осіб", "нагляд за діяльністю компаній").
   - recipient: отримує матеріальні блага, права, документи або повідомлення від іншого суб'єкта ("ліцензіат отримує ліцензію", "банк повідомляється").
   - regulator: встановлює правила, контролює, здійснює нагляд.
   - protected_party: перебуває під захистом норми.
   - other: якщо роль неможливо однозначно встановити через відсутність предикату (дієслова) в наданому LOCAL_CONTEXT.
8. Приводь назву суб’єкта до єдиної канонічної форми:
   - завжди у називному відмінку,
   - завжди в однині,
   - без дублювання множини чи варіантів ("споживач" ≠ "споживачі").
   Якщо у тексті згадано множину, все одно використовуй однину як canonical_name (наприклад, "учасник" замість "учасники").
   Використовуй GLOBAL_CONTEXT для вибору правильної канонічної назви.
   Визначення та унікальні атрибути: Якщо суб'єкт має визначення у GLOBAL_CONTEXT, використовуй його. Якщо в тексті вжито слово, яке є синонімом або варіантом поняття з визначення (наприклад, "компанія" замість "юридична особа"), використовуй канонічну назву з GLOBAL_CONTEXT, а оригінальне слово додай до aliases.
   9. КРИТИЧНЕ ПРАВИЛО ДЛЯ ЮРИДИЧНИХ ПЕРЕЛІКІВ: Якщо LOCAL_CONTEXT є елементом маркованого списку (пунктом, підпунктом) і не містить дієслова, а лише перераховує осіб (наприклад, "2) власників істотної участі..."), НЕ присвоюй роль 'actor' за замовчуванням. Проаналізуй, чи не є ці особи об'єктом дії з вищого рівня акта. Якщо зв'язок не очевидний з LOCAL_CONTEXT, встановлюй роль 'other' або використовуй GLOBAL_CONTEXT для визначення, чи ведеться нагляд НАД ними.
   **Правило узгодження ролі (Actor vs Target_of_control) для перелічених осіб:**
    * **actor** – лише якщо в LOCAL_CONTEXT є активна дієслівна фраза, де цей суб'єкт є виконавцем (наприклад, "особа, яка **подає** декларацію").
    * **target_of_control** – якщо в LOCAL_CONTEXT суб'єкт перерахований у переліку або згадується в пасиві, а в преамбулі чи визначеннях йдеться про контроль, нагляд або регулювання цієї категорії осіб.
    * **other** – якщо зв'язок неможливо встановити однозначно.
10. ОБ'ЄДНАННЯ СИНОНІМІВ ТА КАТЕГОРІЙ: Якщо у LOCAL_CONTEXT зустрічаються кілька назв, що позначають близькі за змістом категорії суб’єктів або є синонімами (наприклад: "маркетплейс", "класифайд", "прайс-агрегатор"), об’єднай їх в один об'єкт:
    - Використовуй найбільш загальну, родову або законодавчо закріплену назву як canonical_name.
    - Усі інші виявлені синоніми чи варіації з цього тексту обов'язково запиши у масив aliases.
    - НЕ створюй окремих об'єктів для кожного синоніма в масиві. Якщо синонімів немає, поле aliases має бути порожнім масивом [].

11. Сформулюй description (опис) для суб'єкта:
    - Якщо в GLOBAL_CONTEXT є визначення цього суб'єкта, стисло виклади його суть (1-2 речення).
    - Якщо визначення немає, спробуй дати коротке загальновживане юридичне визначення (до 10 слів) або поверни null.

12. УВАГА: Якщо назва або синонім містить лапки, обов'язково екрануй їх (наприклад, "Закон України \\"Про захист\\"") для валідного JSON.

Поверни **ТІЛЬКИ** JSON-масив. Якщо суб'єктів немає — поверни порожній масив [].
Формат кожного елемента (ПРИКЛАД, використовуй реальні дані):
[
  {
    "canonical_name": "банк",
    "aliases": ["фінансова установа", "банки"],
    "legal_status": "legal_entity",
    "role": "actor",
    "description": "Юридична особа, яка має виключне право на підставі ліцензії Національного банку України здійснювати банківську діяльність.",
    "confidence": 0.95
  }
]`;

/**
 * Builds the user prompt from law context and element text.
 * @param {object} law - The law document from MongoDB.
 * @param {object} element - The element document from MongoDB.
 * @returns {string}
 */
const buildUserPrompt = (law, element) => {
  const gc = law.global_context || {};

  // Format definitions
  const definitionsText =
    gc.definitions && gc.definitions.length > 0
      ? gc.definitions.map((d) => `  - "${d.term}": ${d.definition}`).join('\n')
      : '  (визначення термінів відсутні)';

  // Format preamble — prefer global_context.preamble, fallback to law.preamble
  const preambleText =
    gc.preamble || law.preamble || '(преамбула відсутня або не розпарсена)';

  const globalContext = `[GLOBAL_CONTEXT]
Закон: ${law.title}
Преамбула: ${preambleText}
Визначення термінів:
${definitionsText}`;

  const localContext = `[LOCAL_CONTEXT]
Тип елемента: ${element.type}
${element.title ? `Назва: ${element.title}` : ''}
Текст: ${element.text || '(текст відсутній)'}`;

  return `${globalContext}\n\n${localContext}`;
};

// ── Core Pipeline ─────────────────────────────────────────────────────────────

/**
 * Analyzes a single Element document for regulatory subjects using LLM (SRL).
 * Idempotent: re-running overwrites the subjects[] array on the element.
 *
 * Pipeline:
 *   1. Fetch element + law (with global_context)
 *   2. Build prompt
 *   3. Call Gemini Flash via llmService
 *   4. For each LLM result → ensureSubjectExists() → get ObjectId
 *   5. Update element.subjects[] in MongoDB
 *
 * @param {string} elementId - MongoDB ObjectId string of the Element.
 * @returns {Promise<{ elementId: string, subjects: Array, raw: Array }>}
 */
export const analyzeElement = async (elementId) => {
  // 1. Fetch element
  const element = await Element.findById(elementId);
  if (!element) {
    throw new Error(`Element not found: ${elementId}`);
  }

  // Skip elements without text (sections, articles with only a title)
  if (!element.text || element.text.trim() === '') {
    return { elementId, subjects: [], raw: [], skipped: true };
  }

  // 2. Fetch law
  const law = await Law.findById(element.lawId);
  if (!law) {
    throw new Error(`Law not found for element: ${elementId}`);
  }

  // 3. Build prompt and query LLM
  const userPrompt = buildUserPrompt(law, element);
  const llmResult = await queryLLM(SYSTEM_PROMPT, userPrompt);

  // llmResult should be an array; guard against unexpected shapes
  const candidates = Array.isArray(llmResult) ? llmResult : [];

  // Filter 1: confidence threshold
  const confident = candidates.filter(
    (c) => typeof c.confidence !== 'number' || c.confidence >= 0.6,
  );

  // Filter 2: remove document/law references mistakenly identified as subjects
  // (LLM sometimes includes law names despite being instructed to ignore them)
  const DOCUMENT_MARKERS = [
    'закон україни',
    'кодекс україни',
    'конституція україни',
    'постанова',
    'наказ',
    'декрет',
    'розпорядження',
    'нормативно-правовий акт',
    'нормативно-правові акти',
    'спеціальні закони',
    'інші закони',
    'цей закон',
  ];

  const isDocumentRef = (name) => {
    const lower = name.toLowerCase();
    return DOCUMENT_MARKERS.some((marker) => lower.includes(marker));
  };

  const validCandidates = confident.filter(
    (c) => c.canonical_name && !isDocumentRef(c.canonical_name),
  );

  // 4. Resolve subjects via global registry
  const resolvedSubjects = await Promise.all(
    validCandidates.map(async (candidate) => {
      const subjectId = await ensureSubjectExists(
        candidate.canonical_name,
        candidate.legal_status,
        candidate.aliases,
        candidate.description,
      );
      return {
        subject_id: subjectId,
        role: candidate.role || 'other',
      };
    }),
  );

  // 5. Update element in DB (overwrite subjects[])
  await Element.updateOne(
    { _id: elementId },
    { $set: { subjects: resolvedSubjects } },
  );

  return {
    elementId,
    subjects: resolvedSubjects,
    raw: validCandidates,
  };
};
