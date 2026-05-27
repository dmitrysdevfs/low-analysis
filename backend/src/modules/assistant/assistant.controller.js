import { consumeAiQuota, peekAiQuota } from './assistant.limits.js';
import { handleStreamChat } from './assistant.orchestrator.js';
import { validateChatRequest } from './assistant.validation.js';
import { getAssistantMode, isAssistantEnabled } from './assistant.config.js';
import AssistantSession from './assistant.session.model.js';
import { SSE_EVENTS } from './assistant.constants.js';

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export async function getConfig(req, res) {
  res.json({
    enabled: isAssistantEnabled(),
    mode: getAssistantMode(),
  });
}

export async function getSuggestions(req, res) {
  const suggestions = [
    'Як знайти закон за назвою?',
    'Що означає червоний ризик?',
    'Як зберегти нотатку до статті?',
    'Як фільтрувати результати пошуку?',
    'Чим відрізняються плани підписки?',
  ];
  res.json({ suggestions });
}

export async function streamChat(req, res) {
  if (!isAssistantEnabled()) {
    res.status(503).json({ message: 'AI assistant is currently disabled' });
    return;
  }

  const validation = validateChatRequest(req.body);
  if (!validation.valid) {
    res.status(400).json({ message: validation.error });
    return;
  }

  const userId = req.user?._id?.toString() || null;
  const userRole = req.user?.role || null;
  const planId = req.body.planId || null;
  const ip = getClientIp(req);

  const quota = consumeAiQuota(userId, ip, userRole, planId);
  if (!quota.allowed) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();
    res.write(
      `data: ${JSON.stringify({
        type: SSE_EVENTS.LIMIT,
        used: quota.used,
        limit: quota.limit,
        resetAt: quota.resetAt,
        message:
          'Ліміт запитів вичерпано. Оновіть план або зачекайте до наступного дня.',
      })}\n\n`,
    );
    res.end();
    return;
  }

  await handleStreamChat({
    res,
    userId,
    guestIp: userId ? null : ip,
    sessionId: validation.sessionId || null,
    message: validation.message,
    contextLawId: req.body.contextLawId || null,
    contextArticleNum: req.body.contextArticleNum || null,
    mode: req.body.mode || 'general',
  });
}

export async function submitFeedback(req, res) {
  const { sessionId, messageId, feedback } = req.body;

  if (!sessionId || !messageId || ![1, -1].includes(feedback)) {
    return res.status(400).json({ message: 'Invalid feedback payload' });
  }

  const userId = req.user?._id?.toString();
  const session = await AssistantSession.findById(sessionId);

  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.userId && session.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const msg = session.messages.id(messageId);
  if (!msg) return res.status(404).json({ message: 'Message not found' });

  msg.feedback = feedback;
  await session.save();
  res.json({ ok: true });
}

export async function getSessions(req, res) {
  const userId = req.user._id.toString();
  const sessions = await AssistantSession.find({ userId })
    .select('_id title createdAt updatedAt messages')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  res.json(
    sessions.map((s) => ({
      id: s._id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
    })),
  );
}

export async function getSession(req, res) {
  const userId = req.user._id.toString();
  const session = await AssistantSession.findById(req.params.id).lean();

  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.userId !== userId)
    return res.status(403).json({ message: 'Forbidden' });

  res.json(session);
}

export async function deleteSession(req, res) {
  const userId = req.user._id.toString();
  const session = await AssistantSession.findById(req.params.id);

  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.userId !== userId)
    return res.status(403).json({ message: 'Forbidden' });

  await session.deleteOne();
  res.json({ ok: true });
}

export async function getQuotaStatus(req, res) {
  const userId = req.user?._id?.toString() || null;
  const ip = getClientIp(req);
  const userRole = req.user?.role || null;
  const planId = req.query.planId || null;

  const status = peekAiQuota(userId, ip, userRole, planId);
  res.json(status);
}
