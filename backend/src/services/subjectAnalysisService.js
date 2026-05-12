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
1. Визнач усі іменникові групи в LOCAL_CONTEXT, що є суб'єктами дії або адресатами норми.
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
   - actor: виконує дію, несе обов'язок ("подає", "зобов'язаний", "здійснює")
   - recipient: отримує дію, адресат ("надається", "повідомляється")
   - regulator: встановлює правила, контролює
   - protected_party: перебуває під захистом норми
   - issuer_of_regulations: видає нормативні акти
   - other: якщо роль не визначена

Поверни **ТІЛЬКИ** JSON-масив. Якщо суб'єктів немає — поверни [].
Формат кожного елемента:
{
  "canonical_name": "назва у називному відмінку",
  "legal_status": "одне зі значень enum",
  "role": "одне зі значень enum",
  "confidence": число від 0.0 до 1.0
}`;

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
    'закон україни', 'кодекс україни', 'конституція україни',
    'постанова', 'наказ', 'декрет', 'розпорядження',
    'нормативно-правовий акт', 'нормативно-правові акти',
    'спеціальні закони', 'інші закони', 'цей закон',
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
