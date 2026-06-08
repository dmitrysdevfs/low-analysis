import SupportConversation from './support.conversation.model.js';
import SupportMessage from './support.message.model.js';
import { appendAuditEntry } from '../../services/admin/audit.service.js';
import { SUPPORT_ENABLED } from './support.constants.js';
import {
  getTelegramSupportConfig,
  mirrorSupportMessageToTelegram,
  extractTelegramConversationId,
  isTelegramAgentAllowed,
} from './support.telegram.service.js';

function normalizeText(value) {
  return String(value ?? '').trim();
}

function clipSnippet(value, limit = 180) {
  const normalized = normalizeText(value).replace(/\s+/g, ' ');
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit - 1)}…`;
}

function conversationOwnerFilter({ user, visitorId }) {
  if (user?._id) {
    return { participantType: 'user', userId: user._id };
  }
  if (visitorId) {
    return { participantType: 'guest', guestVisitorId: visitorId };
  }
  return null;
}

function buildParticipantLabel(conversation) {
  if (conversation.participantType === 'user') {
    return conversation.guestName || 'Авторизований користувач';
  }
  return conversation.guestName || conversation.guestEmail || 'Гість';
}

function serializeConversation(conversation) {
  if (!conversation) {
    return null;
  }
  return {
    id: conversation._id.toString(),
    participantType: conversation.participantType,
    participantLabel: buildParticipantLabel(conversation),
    guestName: conversation.guestName || '',
    guestEmail: conversation.guestEmail || '',
    status: conversation.status,
    subject: conversation.subject,
    startedFromPathname: conversation.startedFromPathname,
    startedFromPageTitle: conversation.startedFromPageTitle,
    contextLawId: conversation.contextLawId,
    contextArticleNum: conversation.contextArticleNum,
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSnippet: conversation.lastMessageSnippet,
    lastSenderType: conversation.lastSenderType,
    unreadForAdmin: conversation.unreadForAdmin,
    unreadForUser: conversation.unreadForUser,
    assignedAdminId: conversation.assignedAdminId
      ? String(conversation.assignedAdminId)
      : null,
    telegramChatId: conversation.telegramChatId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function serializeMessage(message) {
  return {
    id: message._id.toString(),
    senderType: message.senderType,
    senderName: message.senderName,
    senderEmail: message.senderEmail,
    text: message.text,
    channel: message.channel,
    deliveredToTelegram: message.deliveredToTelegram,
    telegramMessageId: message.telegramMessageId,
    createdAt: message.createdAt,
  };
}

async function loadConversationMessages(conversationId) {
  const messages = await SupportMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
  return messages.map(serializeMessage);
}

async function findLatestActiveConversation(ownerFilter) {
  return SupportConversation.findOne({
    ...ownerFilter,
    status: { $ne: 'closed' },
  }).sort({
    updatedAt: -1,
    createdAt: -1,
  });
}

async function mirrorMessageToTelegramIfPossible(conversation, message) {
  try {
    const result = await mirrorSupportMessageToTelegram(conversation, message);
    if (result.delivered) {
      message.deliveredToTelegram = true;
      message.telegramMessageId = result.messageId;
      message.telegramChatId = result.chatId;
      await message.save();
      if (!conversation.telegramChatId && result.chatId) {
        conversation.telegramChatId = result.chatId;
        await conversation.save();
      }
    }
  } catch (err) {
    // Support should keep working even if Telegram bridge is temporarily down.
    console.error('[support] telegram mirror failed:', err.message);
  }
}

async function createStoredMessage({
  conversation,
  senderType,
  senderId = null,
  senderName = '',
  senderEmail = '',
  text,
  channel = 'web',
  mirrorToTelegram = false,
}) {
  const message = await SupportMessage.create({
    conversationId: conversation._id,
    senderType,
    senderId,
    senderName,
    senderEmail,
    text: normalizeText(text),
    channel,
  });

  if (mirrorToTelegram) {
    await mirrorMessageToTelegramIfPossible(conversation, message);
  }

  return message;
}

async function touchConversationAfterMessage(conversation, patch) {
  Object.assign(conversation, patch);
  await conversation.save();
  return conversation;
}

async function getConversationByIdOrThrow(id) {
  const conversation = await SupportConversation.findById(id);
  if (!conversation) {
    throw Object.assign(new Error('Support conversation not found'), {
      status: 404,
    });
  }
  return conversation;
}

function assertOwnership(conversation, { user, visitorId }) {
  if (conversation.participantType === 'user') {
    if (!user?._id || String(conversation.userId) !== String(user._id)) {
      throw Object.assign(new Error('Support conversation not found'), {
        status: 404,
      });
    }
    return;
  }

  if (!visitorId || conversation.guestVisitorId !== visitorId) {
    throw Object.assign(new Error('Support conversation not found'), {
      status: 404,
    });
  }
}

export async function getSupportConfig() {
  const telegram = getTelegramSupportConfig();
  return {
    enabled: SUPPORT_ENABLED,
    telegramConfigured: telegram.configured,
  };
}

export async function getAdminSupportStatus() {
  const telegram = getTelegramSupportConfig();
  const [totalConversations, openConversations, unreadConversations] =
    await Promise.all([
      SupportConversation.countDocuments(),
      SupportConversation.countDocuments({ status: { $ne: 'closed' } }),
      SupportConversation.countDocuments({ unreadForAdmin: { $gt: 0 } }),
    ]);

  return {
    enabled: SUPPORT_ENABLED,
    telegramConfigured: telegram.configured,
    mailboxMode: telegram.configured ? 'telegram-bridge' : 'web-only',
    totalConversations,
    openConversations,
    unreadConversations,
  };
}

export async function getCurrentConversation({ user, visitorId }) {
  const ownerFilter = conversationOwnerFilter({ user, visitorId });
  if (!ownerFilter) {
    return { conversation: null, messages: [] };
  }

  const conversation = await findLatestActiveConversation(ownerFilter);
  if (!conversation) {
    return { conversation: null, messages: [] };
  }

  return {
    conversation: serializeConversation(conversation),
    messages: await loadConversationMessages(conversation._id),
  };
}

export async function postVisitorMessage({
  user,
  visitorId,
  guestName,
  guestEmail,
  text,
  pathname,
  pageTitle,
  lawId,
  articleNum,
}) {
  if (!SUPPORT_ENABLED) {
    throw Object.assign(new Error('Support chat is disabled'), { status: 503 });
  }

  const messageText = normalizeText(text);
  if (!messageText) {
    throw Object.assign(new Error('Support message is required'), {
      status: 400,
    });
  }

  const isAuthenticated = Boolean(user?._id);
  const trimmedGuestName = normalizeText(guestName);
  const trimmedGuestEmail = normalizeText(guestEmail).toLowerCase();

  if (!isAuthenticated) {
    if (!visitorId) {
      throw Object.assign(new Error('Support visitor id is required'), {
        status: 400,
      });
    }
    if (!trimmedGuestName || !trimmedGuestEmail) {
      throw Object.assign(
        new Error('Guest name and email are required for support chat'),
        { status: 400 },
      );
    }
  }

  const ownerFilter = conversationOwnerFilter({ user, visitorId });
  let conversation = await findLatestActiveConversation(ownerFilter);

  if (!conversation) {
    conversation = await SupportConversation.create({
      participantType: isAuthenticated ? 'user' : 'guest',
      userId: isAuthenticated ? user._id : null,
      guestVisitorId: isAuthenticated ? null : visitorId,
      guestName: isAuthenticated
        ? user.fullName || user.displayName || ''
        : trimmedGuestName,
      guestEmail: isAuthenticated ? user.email || '' : trimmedGuestEmail,
      status: 'open',
      subject: 'Support chat',
      startedFromPathname: pathname || '/',
      startedFromPageTitle: pageTitle || '',
      contextLawId: lawId || null,
      contextArticleNum: articleNum || null,
    });
  } else if (!isAuthenticated) {
    conversation.guestName = trimmedGuestName;
    conversation.guestEmail = trimmedGuestEmail;
  }

  const senderName = isAuthenticated
    ? user.fullName || user.displayName || user.email
    : trimmedGuestName;
  const senderEmail = isAuthenticated ? user.email || '' : trimmedGuestEmail;

  const message = await createStoredMessage({
    conversation,
    senderType: 'user',
    senderId: isAuthenticated ? user._id : null,
    senderName,
    senderEmail,
    text: messageText,
    channel: 'web',
    mirrorToTelegram: true,
  });

  await touchConversationAfterMessage(conversation, {
    status: 'waiting_support',
    lastMessageAt: message.createdAt,
    lastMessageSnippet: clipSnippet(messageText),
    lastSenderType: 'user',
    unreadForAdmin: Number(conversation.unreadForAdmin || 0) + 1,
    unreadForUser: 0,
  });

  return {
    conversation: serializeConversation(conversation),
    messages: await loadConversationMessages(conversation._id),
  };
}

export async function markConversationReadForUser({
  conversationId,
  user,
  visitorId,
}) {
  const conversation = await getConversationByIdOrThrow(conversationId);
  assertOwnership(conversation, { user, visitorId });

  conversation.unreadForUser = 0;
  await conversation.save();
  return { ok: true };
}

export async function listAdminConversations({
  query = '',
  status = 'all',
} = {}) {
  const filter = {};
  if (status !== 'all') {
    if (status === 'unread') {
      filter.unreadForAdmin = { $gt: 0 };
    } else {
      filter.status = status;
    }
  }

  const normalizedQuery = normalizeText(query);
  if (normalizedQuery) {
    filter.$or = [
      { guestName: { $regex: normalizedQuery, $options: 'i' } },
      { guestEmail: { $regex: normalizedQuery, $options: 'i' } },
      { lastMessageSnippet: { $regex: normalizedQuery, $options: 'i' } },
      { startedFromPathname: { $regex: normalizedQuery, $options: 'i' } },
    ];
  }

  const conversations = await SupportConversation.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(200)
    .lean();

  return conversations.map((conversation) => ({
    ...serializeConversation(conversation),
  }));
}

export async function getAdminConversation(conversationId) {
  const conversation = await getConversationByIdOrThrow(conversationId);
  return {
    conversation: serializeConversation(conversation),
    messages: await loadConversationMessages(conversation._id),
  };
}

export async function markConversationReadForAdmin(conversationId) {
  const conversation = await getConversationByIdOrThrow(conversationId);
  conversation.unreadForAdmin = 0;
  await conversation.save();
  return { ok: true };
}

export async function postAdminMessage({ conversationId, adminUser, text }) {
  const conversation = await getConversationByIdOrThrow(conversationId);
  const messageText = normalizeText(text);

  if (!messageText) {
    throw Object.assign(new Error('Support reply is required'), {
      status: 400,
    });
  }

  const senderName =
    adminUser?.fullName ||
    adminUser?.displayName ||
    adminUser?.email ||
    'Admin';
  const senderEmail = adminUser?.email || '';

  const message = await createStoredMessage({
    conversation,
    senderType: 'admin',
    senderId: adminUser?._id ?? null,
    senderName,
    senderEmail,
    text: messageText,
    channel: 'web',
    mirrorToTelegram: true,
  });

  await touchConversationAfterMessage(conversation, {
    status: 'waiting_user',
    lastMessageAt: message.createdAt,
    lastMessageSnippet: clipSnippet(messageText),
    lastSenderType: 'admin',
    unreadForUser: Number(conversation.unreadForUser || 0) + 1,
    unreadForAdmin: 0,
  });

  await appendAuditEntry({
    action: 'Support reply sent',
    detail: `Адмін відповів у support chat для діалогу ${conversation._id}.`,
    actor: adminUser?.email || 'admin',
    severity: 'info',
  });

  return {
    conversation: serializeConversation(conversation),
    messages: await loadConversationMessages(conversation._id),
  };
}

export async function updateConversationStatus({
  conversationId,
  status,
  adminUser,
}) {
  const conversation = await getConversationByIdOrThrow(conversationId);
  if (!['open', 'waiting_support', 'waiting_user', 'closed'].includes(status)) {
    throw Object.assign(new Error('Unsupported support status'), {
      status: 400,
    });
  }

  conversation.status = status;
  await conversation.save();

  await appendAuditEntry({
    action: 'Support status updated',
    detail: `Діалог ${conversation._id} переведено у статус ${status}.`,
    actor: adminUser?.email || 'admin',
    severity: 'info',
  });

  return { conversation: serializeConversation(conversation) };
}

export async function handleTelegramUpdate(update) {
  const message = update?.message;
  if (!message || !message.text) {
    return { ok: true, ignored: true, reason: 'unsupported-message' };
  }

  if (message.from?.is_bot) {
    return { ok: true, ignored: true, reason: 'bot-message' };
  }

  if (!isTelegramAgentAllowed(message.from)) {
    return { ok: true, ignored: true, reason: 'agent-not-allowed' };
  }

  const conversationId = extractTelegramConversationId(message);
  if (!conversationId) {
    return { ok: true, ignored: true, reason: 'conversation-not-found' };
  }

  const conversation = await SupportConversation.findById(conversationId);
  if (!conversation) {
    return { ok: true, ignored: true, reason: 'missing-conversation' };
  }

  const senderName =
    [message.from.first_name, message.from.last_name]
      .filter(Boolean)
      .join(' ') ||
    message.from.username ||
    `Telegram ${message.from.id}`;

  const storedMessage = await createStoredMessage({
    conversation,
    senderType: 'telegram_support',
    senderName,
    senderEmail: '',
    text: message.text,
    channel: 'telegram',
    mirrorToTelegram: false,
  });

  await touchConversationAfterMessage(conversation, {
    status: 'waiting_user',
    lastMessageAt: storedMessage.createdAt,
    lastMessageSnippet: clipSnippet(message.text),
    lastSenderType: 'telegram_support',
    unreadForUser: Number(conversation.unreadForUser || 0) + 1,
    unreadForAdmin: 0,
  });

  await appendAuditEntry({
    action: 'Support reply received from Telegram',
    detail: `Для діалогу ${conversation._id} отримано Telegram-відповідь.`,
    actor: senderName,
    severity: 'info',
  });

  return { ok: true };
}
