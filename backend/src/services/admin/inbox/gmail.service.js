import axios from 'axios';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

function normalizeHeaderMap(headers = []) {
  return headers.reduce((acc, header) => {
    acc[String(header.name || '').toLowerCase()] = header.value || '';
    return acc;
  }, {});
}

function decodeBase64Url(value) {
  if (!value) return '';
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLength), 'base64').toString(
    'utf8',
  );
}

function extractBodies(payload) {
  if (!payload) {
    return { plainTextBody: '', htmlBody: '' };
  }

  const currentMimeType = payload.mimeType || '';
  const currentBody = decodeBase64Url(payload.body?.data);
  let plainTextBody = currentMimeType === 'text/plain' ? currentBody : '';
  let htmlBody = currentMimeType === 'text/html' ? currentBody : '';

  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const nested = extractBodies(part);
      if (!plainTextBody && nested.plainTextBody) {
        plainTextBody = nested.plainTextBody;
      }
      if (!htmlBody && nested.htmlBody) {
        htmlBody = nested.htmlBody;
      }
    }
  }

  return { plainTextBody, htmlBody };
}

function splitAddresses(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toStoredMessage(message, mailboxEmail) {
  const headerMap = normalizeHeaderMap(message.payload?.headers);
  const { plainTextBody, htmlBody } = extractBodies(message.payload);
  const from = headerMap.from || '';
  const to = splitAddresses(headerMap.to);
  const cc = splitAddresses(headerMap.cc);
  const subject = headerMap.subject || '(Без теми)';
  const labels = Array.isArray(message.labelIds) ? message.labelIds : [];
  const normalizedMailbox = String(mailboxEmail || '').toLowerCase();
  const isInbound = normalizedMailbox
    ? !String(from).toLowerCase().includes(normalizedMailbox)
    : true;

  return {
    gmailMessageId: message.id,
    gmailThreadId: message.threadId,
    from,
    to,
    cc,
    subject,
    snippet: message.snippet || '',
    plainTextBody,
    htmlBody,
    labels,
    internalDate: message.internalDate
      ? new Date(Number(message.internalDate))
      : null,
    isInbound,
    syncedAt: new Date(),
  };
}

export function summarizeThread(thread, storedMessages) {
  const sortedMessages = [...storedMessages].sort(
    (left, right) =>
      new Date(right.internalDate || 0).getTime() -
      new Date(left.internalDate || 0).getTime(),
  );
  const latest = sortedMessages[0];
  const participants = Array.from(
    new Set(
      sortedMessages
        .flatMap((message) => [message.from, ...message.to, ...message.cc])
        .filter(Boolean),
    ),
  );
  const labels = Array.from(
    new Set(sortedMessages.flatMap((message) => message.labels || [])),
  );
  const unreadCount = sortedMessages.filter((message) =>
    (message.labels || []).includes('UNREAD'),
  ).length;

  return {
    gmailThreadId: thread.id,
    subject: latest?.subject || '(Без теми)',
    snippet: thread.snippet || latest?.snippet || '',
    participants,
    unreadCount,
    messageCount: sortedMessages.length,
    labels,
    lastMessageAt: latest?.internalDate || null,
    syncedAt: new Date(),
  };
}

export async function gmailRequest(accessToken, method, path, options = {}) {
  const url = `${GMAIL_API_BASE}${path}`;
  const response = await axios({
    method,
    url,
    params: options.params,
    data: options.data,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  return response.data;
}

export async function getMailboxProfile(accessToken) {
  return await gmailRequest(accessToken, 'get', '/profile');
}

export async function listThreads(accessToken, maxResults = 25) {
  return await gmailRequest(accessToken, 'get', '/threads', {
    params: {
      maxResults,
      q: '-in:chats',
    },
  });
}

export async function getThread(accessToken, threadId) {
  return await gmailRequest(accessToken, 'get', `/threads/${threadId}`, {
    params: { format: 'full' },
  });
}

export async function removeUnreadFromThread(accessToken, gmailMessageIds) {
  await Promise.all(
    gmailMessageIds.map((gmailMessageId) =>
      gmailRequest(accessToken, 'post', `/messages/${gmailMessageId}/modify`, {
        data: {
          removeLabelIds: ['UNREAD'],
        },
      }),
    ),
  );
}

function buildReplyRaw({ from, to, subject, text, inReplyTo, references }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject.startsWith('Re:') ? subject : `Re: ${subject}`}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    headers.push(`References: ${references}`);
  }

  const message = `${headers.join('\r\n')}\r\n\r\n${text}`;
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildEmailRaw({ from, to, subject, text }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
  ];
  const message = `${headers.join('\r\n')}\r\n\r\n${text}`;
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export async function sendNewEmail(accessToken, { from, to, subject, text }) {
  const raw = buildEmailRaw({ from, to, subject, text });
  return await gmailRequest(accessToken, 'post', '/messages/send', {
    headers: { 'Content-Type': 'application/json' },
    data: { raw },
  });
}

export async function sendThreadReply(accessToken, payload) {
  const raw = buildReplyRaw(payload);
  return await gmailRequest(accessToken, 'post', '/messages/send', {
    headers: { 'Content-Type': 'application/json' },
    data: {
      threadId: payload.threadId,
      raw,
    },
  });
}
