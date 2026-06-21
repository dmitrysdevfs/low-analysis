const TELEGRAM_API_BASE = 'https://api.telegram.org';
const CONVERSATION_TOKEN = /\[#conv:([a-f0-9]{24})\]/i;
const TELEGRAM_MESSAGE_LIMIT = 3500;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function clipText(value, limit = TELEGRAM_MESSAGE_LIMIT) {
  const normalized = String(value ?? '').trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit - 1)}…`;
}

function readAllowedUserIds() {
  return String(process.env.TELEGRAM_SUPPORT_ALLOWED_USER_IDS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getTelegramSupportConfig() {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN ?? '';
  const chatId = process.env.TELEGRAM_SUPPORT_CHAT_ID ?? '';
  const secret = process.env.TELEGRAM_SUPPORT_WEBHOOK_SECRET ?? '';
  const allowedUserIds = readAllowedUserIds();

  return {
    configured: Boolean(botToken && chatId),
    botToken,
    chatId,
    secret,
    allowedUserIds,
  };
}

async function telegramRequest(method, payload) {
  const config = getTelegramSupportConfig();
  if (!config.configured) {
    throw Object.assign(
      new Error('Telegram support bridge is not configured'),
      {
        status: 503,
      },
    );
  }

  const res = await fetch(
    `${TELEGRAM_API_BASE}/bot${config.botToken}/${method}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw Object.assign(
      new Error(data.description || `Telegram API error: ${res.status}`),
      { status: 502 },
    );
  }

  return data.result;
}

function buildParticipantLine(conversation) {
  if (conversation.participantType === 'user') {
    return `Авторизований користувач`;
  }

  const guestName = conversation.guestName || 'Гість';
  const guestEmail = conversation.guestEmail
    ? ` <${conversation.guestEmail}>`
    : '';
  return `Гість: ${guestName}${guestEmail}`;
}

function buildContextLine(conversation) {
  const bits = [];
  if (conversation.startedFromPathname) {
    bits.push(`Сторінка: ${conversation.startedFromPathname}`);
  }
  if (conversation.startedFromPageTitle) {
    bits.push(`Заголовок: ${conversation.startedFromPageTitle}`);
  }
  return bits.join('\n');
}

export function buildTelegramOutboundText(conversation, message) {
  const header =
    message.senderType === 'admin'
      ? 'Відповідь з адмінки'
      : message.senderType === 'telegram_support'
        ? 'Відповідь із Telegram'
        : 'Нове звернення з сайту';

  const senderName = message.senderName || 'Невідомий користувач';
  const senderEmail = message.senderEmail ? ` <${message.senderEmail}>` : '';
  const contextLine = buildContextLine(conversation);

  return clipText(
    [
      `<b>${escapeHtml(header)}</b>`,
      `<code>[#conv:${conversation._id}]</code>`,
      `<b>Учасник:</b> ${escapeHtml(buildParticipantLine(conversation))}`,
      `<b>Відправник:</b> ${escapeHtml(senderName + senderEmail)}`,
      contextLine ? `<b>Контекст:</b>\n${escapeHtml(contextLine)}` : '',
      `<b>Повідомлення:</b>\n${escapeHtml(message.text)}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

export async function mirrorSupportMessageToTelegram(conversation, message) {
  const config = getTelegramSupportConfig();
  if (!config.configured) {
    return { delivered: false };
  }

  const result = await telegramRequest('sendMessage', {
    chat_id: config.chatId,
    text: buildTelegramOutboundText(conversation, message),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  return {
    delivered: true,
    chatId: String(result.chat?.id ?? config.chatId),
    messageId: result.message_id ?? null,
  };
}

export function verifyTelegramWebhook(req) {
  const { secret } = getTelegramSupportConfig();
  if (!secret) {
    return true;
  }
  return req.get('x-telegram-bot-api-secret-token') === secret;
}

export function isTelegramAgentAllowed(telegramUser) {
  const { allowedUserIds } = getTelegramSupportConfig();
  if (!allowedUserIds.length) {
    return true;
  }
  return allowedUserIds.includes(String(telegramUser?.id ?? ''));
}

export function extractTelegramConversationId(message) {
  const replyText = message?.reply_to_message?.text ?? '';
  const directText = message?.text ?? '';
  const candidate = `${replyText}\n${directText}`;
  const match = candidate.match(CONVERSATION_TOKEN);
  return match?.[1] ?? null;
}

export function stripConversationToken(text) {
  return String(text ?? '').replace(CONVERSATION_TOKEN, '').trim();
}

export async function setTelegramWebhook(webhookUrl) {
  const result = await telegramRequest('setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message'],
  });
  return { ok: true, description: result?.description ?? 'Webhook set', url: webhookUrl };
}

export async function getTelegramWebhookInfo() {
  const config = getTelegramSupportConfig();
  if (!config.configured) {
    return { ok: false, error: 'Telegram not configured' };
  }
  const res = await fetch(
    `${TELEGRAM_API_BASE}/bot${config.botToken}/getWebhookInfo`,
  );
  const data = await res.json().catch(() => ({}));
  return data?.result ?? {};
}
