import { getAssistantMode, CHAT_LLM_CONFIG } from './assistant.config.js';
import { generateStubResponse } from './assistant.stub.js';
import { SSE_EVENTS, MAX_HISTORY_MESSAGES } from './assistant.constants.js';
import AssistantSession from './assistant.session.model.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const ROLE_SYSTEM_PROMPTS = {
  general:
    'Ти — Lex, AI Помічник платформи Law Analysis. ' +
    'Відповідай українською мовою. ' +
    'Допомагай користувачам розібратися в законодавстві України. ' +
    'Будь точним, коротким і корисним. Якщо не знаєш відповіді — чесно скажи про це.',
  lawyer:
    'Ти — Lex, AI асистент у ролі адвоката на платформі Law Analysis. ' +
    'Відповідай українською мовою. ' +
    'Знаходь процесуальні права клієнта, підстави для захисту, строки оскарження, ' +
    'способи оскаржити рішення. Акцентуй на захисті прав особи відповідно до законодавства України.',
  prosecutor:
    'Ти — Lex, AI асистент у ролі прокурора на платформі Law Analysis. ' +
    'Відповідай українською мовою. ' +
    'Аналізуй склад злочину, кваліфікацію діяння, застосовні санкції, вимоги до доказової бази. ' +
    'Допомагай визначити правову позицію обвинувачення відповідно до КК та КПК України.',
  judge:
    'Ти — Lex, AI асистент у ролі судді на платформі Law Analysis. ' +
    'Відповідай українською мовою. Аналізуй питання неупереджено і нейтрально. ' +
    'Виділяй ключові норми права, можливі правові позиції обох сторін, ' +
    'релевантну судову практику і прецеденти. Не давай порад на користь жодної зі сторін.',
  notary:
    'Ти — Lex, AI асистент у ролі нотаріуса на платформі Law Analysis. ' +
    'Відповідай українською мовою. ' +
    'Акцент на правочинах, нотаріальному посвідченні, державній реєстрації, вимогах до документів. ' +
    'Пояснюй нотаріальні процедури та відповідні законодавчі вимоги.',
  business:
    'Ти — Lex, AI асистент для підприємців на платформі Law Analysis. ' +
    'Відповідай українською мовою, простою зрозумілою мовою без зайвого юридичного жаргону. ' +
    "Пояснюй права та обов'язки бізнесу, штрафи, необхідні дозволи та процедури. " +
    'Якщо можливо — наводь конкретні числа, строки, суми.',
};

const VALID_ROLES = new Set(Object.keys(ROLE_SYSTEM_PROMPTS));

async function streamStub(res, content, sources) {
  const words = content.split(/(?<=\s)|(?=\s)/);
  for (const chunk of words) {
    sendSSE(res, { type: SSE_EVENTS.TOKEN, content: chunk });
    await sleep(18);
  }
  sendSSE(res, { type: SSE_EVENTS.DONE, sources });
}

async function streamLLM(res, systemPrompt, history, userMessage) {
  let accumulated = '';
  try {
    const { queryChatAssistant } = await import('./assistant.llm.js');
    const stream = await queryChatAssistant(
      systemPrompt,
      history,
      userMessage,
      {
        temperature: CHAT_LLM_CONFIG.temperature,
        maxOutputTokens: CHAT_LLM_CONFIG.maxOutputTokens,
      },
    );

    for await (const chunk of stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        accumulated += text;
        sendSSE(res, { type: SSE_EVENTS.TOKEN, content: text });
      }
    }

    sendSSE(res, { type: SSE_EVENTS.DONE, sources: [] });
    return accumulated;
  } catch (err) {
    console.error('[assistant.orchestrator] LLM stream error:', err.message);
    const { content, sources: stubSources } = generateStubResponse(userMessage);
    await streamStub(res, content, stubSources);
    return content;
  }
}

/**
 * Derive a short session title from the first user message.
 */
function deriveTitle(message) {
  return message.length > 55 ? message.slice(0, 52) + '...' : message;
}

/**
 * Handle a streaming chat request.
 * Sets SSE headers and streams the response.
 */
export async function handleStreamChat({
  res,
  userId,
  guestIp,
  sessionId,
  message,
  contextLawId,
  contextArticleNum,
  lawTitle,
  mode,
  role,
}) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let session = null;

  try {
    // Load or create session
    if (sessionId) {
      session = await AssistantSession.findById(sessionId).catch(() => null);
      if (session && session.userId && session.userId !== userId) {
        // Security: session belongs to another user
        session = null;
      }
    }

    if (!session) {
      session = new AssistantSession({
        userId: userId || null,
        guestIp: userId ? null : guestIp,
        mode: mode || 'general',
        role: role || 'general',
        contextLawId: contextLawId || null,
        contextArticleNum: contextArticleNum || null,
        title: deriveTitle(message),
        messages: [],
      });
    }

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Trim history to limit
    if (session.messages.length > MAX_HISTORY_MESSAGES * 2) {
      session.messages = session.messages.slice(-MAX_HISTORY_MESSAGES * 2);
    }

    // Stream response
    const currentMode = getAssistantMode();
    const context = {
      lawId: contextLawId,
      articleNum: contextArticleNum,
      lawTitle,
    };
    let assistantContent = '';
    let assistantSources = [];

    if (currentMode === 'stub') {
      const { content, sources } = generateStubResponse(message, context);
      assistantContent = content;
      assistantSources = sources;
      await streamStub(res, content, sources);
    } else {
      const systemPrompt = buildSystemPrompt(mode, { ...context, role });
      const history = session.messages
        .slice(0, -1)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      assistantContent = await streamLLM(res, systemPrompt, history, message);
      assistantSources = [];
    }

    // Save assistant message to session
    session.messages.push({
      role: 'assistant',
      content: assistantContent,
      sources: assistantSources,
    });

    if (userId) {
      await session.save();
    }

    // Send session ID so frontend can attach future messages
    sendSSE(res, {
      type: 'session',
      sessionId: session._id.toString(),
      title: session.title,
    });
  } catch (err) {
    console.error('[assistant.orchestrator] error:', err.message);
    sendSSE(res, { type: SSE_EVENTS.ERROR, message: 'Помилка обробки запиту' });
  } finally {
    res.end();
  }
}

function buildSystemPrompt(mode, context) {
  const roleKey = VALID_ROLES.has(context.role) ? context.role : 'general';
  let base = ROLE_SYSTEM_PROMPTS[roleKey];

  if (context.lawTitle) {
    base += ` Поточний закон: "${context.lawTitle}".`;
  } else if (mode === 'law' && context.lawId) {
    base += ` Закон ID: "${context.lawId}".`;
  }

  if (mode === 'article' && context.articleNum) {
    base += ` Стаття: ${context.articleNum}.`;
  }

  return base;
}
