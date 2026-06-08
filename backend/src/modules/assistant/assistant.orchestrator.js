import { getAssistantMode, CHAT_LLM_CONFIG } from './assistant.config.js';
import { generateStubResponse } from './assistant.stub.js';
import { SSE_EVENTS, MAX_HISTORY_MESSAGES } from './assistant.constants.js';
import AssistantSession from './assistant.session.model.js';
import { retrieveRelevantArticles } from './assistant.retriever.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Stream a stub response word-by-word.
 */
async function streamStub(res, content, sources) {
  const words = content.split(/(?<=\s)|(?=\s)/);
  for (const chunk of words) {
    sendSSE(res, { type: SSE_EVENTS.TOKEN, content: chunk });
    await sleep(18);
  }
  sendSSE(res, { type: SSE_EVENTS.DONE, sources });
}

/**
 * Stream a real LLM response.
 * Requires queryChatLLM to be available in llmService.
 */
async function streamLLM(res, systemPrompt, history, userMessage, sources) {
  let accumulatedText = '';
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
        accumulatedText += text;
        sendSSE(res, { type: SSE_EVENTS.TOKEN, content: text });
      }
    }

    // V4: extract used-source indices marker appended by LLM
    const usedMarkerRe = /<!--USED:\[([0-9,\s]*)\]-->\s*$/;
    const markerMatch = accumulatedText.match(usedMarkerRe);
    let finalContent = accumulatedText;
    let finalSources = sources;

    if (markerMatch) {
      finalContent = accumulatedText.replace(usedMarkerRe, '').trimEnd();
      const usedIndices = markerMatch[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      if (usedIndices.length && sources.length) {
        finalSources = sources.filter((s) => usedIndices.includes(s.index));
      }
    }

    sendSSE(res, { type: SSE_EVENTS.DONE, sources: finalSources });
    return { content: finalContent, sources: finalSources };
  } catch (err) {
    console.error('[assistant.orchestrator] LLM stream error:', err.message);
    const { content, sources: stubSources } = generateStubResponse(userMessage);
    await streamStub(res, content, stubSources);
    return { content, sources: stubSources };
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
  mode,
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
    const context = { lawId: contextLawId, articleNum: contextArticleNum };
    let assistantContent = '';
    let assistantSources = [];

    if (currentMode === 'stub') {
      const { content, sources } = generateStubResponse(message, context);
      assistantContent = content;
      assistantSources = sources;
      await streamStub(res, content, sources);
    } else {
      const retrievedSources = await retrieveRelevantArticles(
        message,
        contextLawId,
      );
      const systemPrompt = buildSystemPrompt(mode, context, retrievedSources);
      const history = session.messages
        .slice(0, -1)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await streamLLM(
        res,
        systemPrompt,
        history,
        message,
        retrievedSources,
      );
      assistantContent = result.content;
      assistantSources = result.sources;
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

function buildSystemPrompt(mode, context, articles = []) {
  let base =
    'Ти — Lex, AI Помічник платформи Law Analysis. ' +
    'Відповідай українською мовою. ' +
    'Ти допомагаєш користувачам розібратися в законодавстві України. ' +
    'Будь точним, коротким і корисним. ' +
    'Якщо не знаєш відповіді — чесно скажи про це.';

  if (mode === 'law' && context.lawId) {
    base += ` Поточний контекст: закон з ID "${context.lawId}".`;
  }
  if (mode === 'article' && context.lawId && context.articleNum) {
    base += ` Поточний контекст: стаття ${context.articleNum} закону "${context.lawId}".`;
  }

  if (articles.length) {
    base += '\n\nРелевантні статті законодавства для відповіді:\n';
    for (const art of articles) {
      base += `\n[${art.index}] Стаття ${art.articleNum}${art.articleTitle ? ` "${art.articleTitle}"` : ''} — ${art.lawTitle}\n${art.text}\n`;
    }
    base +=
      '\nЯкщо ти використав будь-які статті з наведеного контексту — ' +
      'додай в самому кінці відповіді маркер: <!--USED:[0,1,2]--> ' +
      'де числа — індекси використаних статей (у квадратних дужках через кому). ' +
      'Якщо жодна стаття не використана — маркер не додавай.';
  }

  return base;
}
