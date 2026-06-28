import * as Sentry from '@sentry/node';
import { getAssistantMode, CHAT_LLM_CONFIG } from './assistant.config.js';
import { generateStubResponse } from './assistant.stub.js';
import {
  SSE_EVENTS,
  MAX_HISTORY_MESSAGES,
  ASSISTANT_MESSAGES,
} from './assistant.constants.js';
import AssistantSession from './assistant.session.model.js';
import { retrieveRelevantArticles } from './assistant.retriever.js';
import Element from '../../models/Element.js';
import Law from '../../models/Law.js';

const ACTIVE_ARTICLE_TRUNCATE = 10000;
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

async function streamLLM(
  res,
  systemPrompt,
  history,
  userMessage,
  sources,
  maxOutputTokens,
) {
  let accumulatedText = '';
  try {
    const { queryChatAssistant } = await import('./assistant.llm.js');
    const stream = await queryChatAssistant(
      systemPrompt,
      history,
      userMessage,
      {
        temperature: CHAT_LLM_CONFIG.temperature,
        maxOutputTokens: maxOutputTokens || CHAT_LLM_CONFIG.maxOutputTokens,
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
    if (err.message === 'ASSISTANT_DAILY_LIMIT_REACHED') {
      sendSSE(res, {
        type: SSE_EVENTS.LIMIT,
        message: ASSISTANT_MESSAGES.GLOBAL_LIMIT,
      });
      return { content: '', sources: [] };
    }
    Sentry.captureException(err, {
      tags: { module: 'assistant.orchestrator', fn: 'streamLLM' },
    });
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
  userRole,
  guestIp,
  sessionId,
  message,
  contextLawId,
  contextArticleNum,
  mode,
  role,
  lawTitle,
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
    } else {
      // Dynamic Session Context Persistence:
      // Update session's context fields on continuation of conversation
      if (contextLawId) {
        session.contextLawId = contextLawId;
      }
      if (contextArticleNum) {
        session.contextArticleNum = contextArticleNum;
      }
      if (mode) {
        session.mode = mode;
      }
      if (role) {
        session.role = role;
      }
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
      // Fetch and compile active article content if mode is 'article'
      let activeArticle = null;
      if (mode === 'article' && contextLawId && contextArticleNum) {
        try {
          const activeElement = await Element.findOne({
            lawId: contextLawId,
            number: contextArticleNum,
            type: 'article',
          }).lean();

          if (activeElement) {
            const law = await Law.findById(contextLawId)
              .select('title source')
              .lean();
            const escapeRegex = (string) =>
              string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const codePrefix = new RegExp(
              `^${escapeRegex(activeElement.code)}\\.`,
            );

            const children = await Element.find({
              lawId: contextLawId,
              $or: [{ parentId: activeElement._id }, { code: codePrefix }],
            })
              .sort({ order: 1 })
              .lean();

            let fullText = '';
            if (activeElement.title) {
              fullText += `${activeElement.title}\n`;
            }
            if (activeElement.text) {
              const riskMarker = activeElement.risk_level && activeElement.risk_level !== 'green'
                ? ` [Рівень ризику: ${activeElement.risk_level === 'red' ? 'червоний (аномальний обсяг/заплутаність)' : 'жовтий (підвищена складність)'}]`
                : '';
              fullText += `${activeElement.text}${riskMarker}\n`;
            }
            for (const child of children) {
              if (child.text) {
                const riskMarker = child.risk_level && child.risk_level !== 'green'
                  ? ` [Рівень ризику: ${child.risk_level === 'red' ? 'червоний (аномальний обсяг/заплутаність)' : 'жовтий (підвищена складність)'}]`
                  : '';
                fullText += `${child.text}${riskMarker}\n`;
              }
            }

            activeArticle = {
              index: 0,
              lawId: contextLawId,
              lawTitle: law?.title || contextLawId,
              articleNum: contextArticleNum,
              articleTitle: activeElement.title || '',
              text: fullText.trim().slice(0, ACTIVE_ARTICLE_TRUNCATE),
              title: `Стаття ${contextArticleNum}${activeElement.title ? ` "${activeElement.title}"` : ''} — ${law?.title || contextLawId}`,
              href: law?.source || null,
              type: 'article',
            };
          }
        } catch (err) {
          Sentry.captureException(err, {
            tags: { module: 'assistant.orchestrator', fn: 'handleStreamChat.fetchActiveArticle' },
          });
          console.error(
            '[assistant.orchestrator] Error fetching active article:',
            err.message,
          );
        }
      }

      let retrievedSources = await retrieveRelevantArticles(
        message,
        contextLawId,
      );

      // Prepend active article and remove duplicates
      if (activeArticle) {
        retrievedSources = retrievedSources.filter(
          (s) =>
            !(
              s.lawId.toString() === activeArticle.lawId.toString() &&
              s.articleNum === activeArticle.articleNum
            ),
        );
        retrievedSources = [activeArticle, ...retrievedSources];
        retrievedSources = retrievedSources.map((s, idx) => ({
          ...s,
          index: idx,
        }));
      }

      const systemPrompt = buildSystemPrompt(
        mode,
        context,
        retrievedSources,
        role,
        lawTitle,
      );
      const history = session.messages
        .slice(0, -1)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      // Set dynamic output token limit: 4096 for lawmakers and admins, 2048 default
      const maxOutputTokens = (userRole === 'lawmaker' || userRole === 'admin')
        ? 4096
        : CHAT_LLM_CONFIG.maxOutputTokens;

      const result = await streamLLM(
        res,
        systemPrompt,
        history,
        message,
        retrievedSources,
        maxOutputTokens,
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
    Sentry.captureException(err, {
      tags: { module: 'assistant.orchestrator', fn: 'handleStreamChat' },
    });
    console.error('[assistant.orchestrator] error:', err.message);
    sendSSE(res, {
      type: SSE_EVENTS.ERROR,
      message: ASSISTANT_MESSAGES.REQUEST_ERROR,
    });
  } finally {
    res.end();
  }
}

const ROLE_ADDONS = {
  lawyer:
    'Ти консультуєш практикуючого адвоката. Звертай увагу на процесуальні норми, строки, санкції та судову практику.',
  prosecutor:
    'Ти консультуєш прокурора. Акцентуй на публічному інтересі, підставах для позовів та кримінально-правових нормах.',
  judge:
    'Ти консультуєш суддю. Давай збалансований аналіз, посилайся на процесуальні кодекси і практику Верховного Суду.',
  notary:
    'Ти консультуєш нотаріуса. Акцентуй на документах, нотаріальних діях, реєстрах і формальних вимогах.',
  business:
    'Ти консультуєш підприємця. Акцентуй на практичних наслідках для бізнесу, відповідальності та ліцензуванні.',
};

function buildSystemPrompt(
  mode,
  context,
  articles = [],
  role = 'general',
  lawTitle = null,
) {
  let base =
    'Ти — Lex, AI Помічник платформи Law Analysis. ' +
    'Відповідай українською мовою. ' +
    'Ти допомагаєш користувачам розібратися в законодавстві України. ' +
    'Будь точним, коротким і корисним. ' +
    'Якщо не знаєш відповіді — чесно скажи про це.';

  if (role && ROLE_ADDONS[role]) {
    base += ' ' + ROLE_ADDONS[role];
  }

  if (mode === 'law' && context.lawId) {
    const label = lawTitle || context.lawId;
    base += ` Поточний контекст: закон "${label}".`;
  }
  if (mode === 'article' && context.lawId && context.articleNum) {
    const label = lawTitle || context.lawId;
    base += ` Поточний контекст: стаття ${context.articleNum} закону "${label}" (вона наведена першою під індексом [0] у релевантних статтях нижче).`;
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
