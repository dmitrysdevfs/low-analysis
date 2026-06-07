import GmailConnection from '../../../models/GmailConnection.js';
import InboxThread from '../../../models/InboxThread.js';
import InboxMessage from '../../../models/InboxMessage.js';
import { appendAuditEntry } from '../audit.service.js';
import {
  buildConnectUrl,
  exchangeCodeForTokens,
  getGmailOauthConfig,
  readConnectState,
  refreshAccessToken,
} from './oauth.service.js';
import {
  getMailboxProfile,
  getThread,
  listThreads,
  removeUnreadFromThread,
  sendThreadReply,
  summarizeThread,
  toStoredMessage,
} from './gmail.service.js';

const SHARED_CONNECTION_KEY = 'shared-gmail-inbox';

function buildStatusPayload(connection) {
  const config = getGmailOauthConfig();
  return {
    configured: config.configured,
    connected: Boolean(
      connection &&
      connection.status === 'connected' &&
      connection.mailboxEmail &&
      connection.refreshToken,
    ),
    mailboxEmail: connection?.mailboxEmail ?? null,
    connectedAt: connection?.connectedAt ?? null,
    connectedBy: connection?.connectedBy ?? null,
    lastSyncAt: connection?.lastSyncAt ?? null,
    lastError: connection?.lastError ?? null,
    scopes: connection?.scopes ?? config.scopes,
  };
}

async function getConnection({ withSecrets = false } = {}) {
  const query = GmailConnection.findOne({ key: SHARED_CONNECTION_KEY });
  if (withSecrets) {
    query.select('+accessToken +refreshToken');
  }
  return await query.lean(false);
}

async function getAuthorizedConnection() {
  const connection = await getConnection({ withSecrets: true });
  if (!connection || !connection.refreshToken) {
    throw Object.assign(new Error('Gmail mailbox is not connected'), {
      status: 400,
    });
  }

  const expiresAt = connection.tokenExpiryDate
    ? new Date(connection.tokenExpiryDate).getTime()
    : 0;
  const shouldRefresh =
    !connection.accessToken || expiresAt <= Date.now() + 60_000;

  if (!shouldRefresh) {
    return connection;
  }

  const refreshed = await refreshAccessToken(connection.refreshToken);
  connection.accessToken = refreshed.access_token;
  connection.tokenExpiryDate = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000)
    : connection.tokenExpiryDate;
  if (refreshed.scope) {
    connection.scopes = refreshed.scope.split(' ');
  }
  connection.status = 'connected';
  connection.lastError = null;
  await connection.save();
  return connection;
}

async function persistThreadSnapshot(connection, gmailThread) {
  const storedMessages = gmailThread.messages.map((message) => ({
    connectionKey: SHARED_CONNECTION_KEY,
    ...toStoredMessage(message, connection.mailboxEmail),
  }));

  await Promise.all(
    storedMessages.map((message) =>
      InboxMessage.findOneAndUpdate(
        { gmailMessageId: message.gmailMessageId },
        { $set: message },
        { upsert: true, new: true },
      ),
    ),
  );

  const threadSummary = summarizeThread(gmailThread, storedMessages);
  await InboxThread.findOneAndUpdate(
    { gmailThreadId: gmailThread.id },
    {
      $set: {
        connectionKey: SHARED_CONNECTION_KEY,
        ...threadSummary,
      },
    },
    { upsert: true, new: true },
  );
}

function chooseReplyTarget(messages, mailboxEmail) {
  const normalizedMailbox = String(mailboxEmail || '').toLowerCase();
  const inbound = [...messages]
    .sort(
      (left, right) =>
        new Date(right.internalDate || 0).getTime() -
        new Date(left.internalDate || 0).getTime(),
    )
    .find((message) => {
      const from = String(message.from || '').toLowerCase();
      return normalizedMailbox
        ? !from.includes(normalizedMailbox)
        : message.isInbound;
    });

  return inbound ?? messages[messages.length - 1] ?? null;
}

export async function getInboxStatus() {
  const connection = await getConnection();
  const baseStatus = buildStatusPayload(connection);
  if (!baseStatus.connected) {
    return {
      ...baseStatus,
      totalThreads: 0,
      unreadThreads: 0,
    };
  }

  const [totalThreads, unreadThreads] = await Promise.all([
    InboxThread.countDocuments({ connectionKey: SHARED_CONNECTION_KEY }),
    InboxThread.countDocuments({
      connectionKey: SHARED_CONNECTION_KEY,
      unreadCount: { $gt: 0 },
    }),
  ]);

  return {
    ...baseStatus,
    totalThreads,
    unreadThreads,
  };
}

export async function createConnectUrl(actorEmail, returnTo) {
  const authUrl = buildConnectUrl({ actorEmail, returnTo });
  return { authUrl };
}

export async function completeConnect(code, state) {
  const parsedState = readConnectState(state);
  const tokens = await exchangeCodeForTokens(code);
  const accessToken = tokens.access_token;
  const existingConnection = await getConnection({ withSecrets: true });
  const refreshToken =
    tokens.refresh_token ?? existingConnection?.refreshToken ?? null;
  const tokenExpiryDate = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;
  const scopes = tokens.scope ? tokens.scope.split(' ') : [];
  const profile = await getMailboxProfile(accessToken);

  const connection = await GmailConnection.findOneAndUpdate(
    { key: SHARED_CONNECTION_KEY },
    {
      $set: {
        provider: 'gmail',
        mailboxEmail: profile.emailAddress?.toLowerCase() ?? null,
        status: 'connected',
        accessToken,
        refreshToken,
        tokenExpiryDate,
        scopes,
        connectedAt: new Date(),
        connectedBy: parsedState.actorEmail ?? null,
        lastError: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await appendAuditEntry({
    action: 'Gmail inbox підключено',
    detail: `Поштову скриньку ${connection.mailboxEmail} підключено до admin inbox.`,
    actor: parsedState.actorEmail ?? 'admin',
    severity: 'security',
  });

  return {
    returnTo: parsedState.returnTo,
    mailboxEmail: connection.mailboxEmail,
  };
}

export async function disconnectInbox(actorEmail) {
  await GmailConnection.findOneAndUpdate(
    { key: SHARED_CONNECTION_KEY },
    {
      $set: {
        status: 'disconnected',
        mailboxEmail: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiryDate: null,
        scopes: [],
        connectedAt: null,
        connectedBy: null,
        lastSyncAt: null,
        lastHistoryId: null,
        lastError: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await appendAuditEntry({
    action: 'Gmail inbox відключено',
    detail: 'Спільну Gmail-скриньку відключено від admin inbox.',
    actor: actorEmail,
    severity: 'warning',
  });

  return { ok: true };
}

export async function syncInbox(actorEmail) {
  const connection = await getAuthorizedConnection();
  const threadsPage = await listThreads(connection.accessToken, 25);
  const refs = threadsPage.threads ?? [];

  for (const threadRef of refs) {
    const gmailThread = await getThread(connection.accessToken, threadRef.id);
    await persistThreadSnapshot(connection, gmailThread);
    if (gmailThread.historyId) {
      connection.lastHistoryId = String(gmailThread.historyId);
    }
  }

  connection.lastSyncAt = new Date();
  connection.lastError = null;
  await connection.save();

  await appendAuditEntry({
    action: 'Inbox синхронізовано',
    detail: `Оновлено ${refs.length} тредів зі спільної Gmail-скриньки ${connection.mailboxEmail}.`,
    actor: actorEmail,
    severity: 'info',
  });

  return {
    syncedThreads: refs.length,
    lastSyncAt: connection.lastSyncAt,
  };
}

export async function listInboxThreads({ query, unreadOnly }) {
  const filter = {
    connectionKey: SHARED_CONNECTION_KEY,
  };

  if (unreadOnly) {
    filter.unreadCount = { $gt: 0 };
  }

  if (query) {
    filter.$or = [
      { subject: { $regex: query, $options: 'i' } },
      { snippet: { $regex: query, $options: 'i' } },
      { participants: { $elemMatch: { $regex: query, $options: 'i' } } },
    ];
  }

  const threads = await InboxThread.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  return threads.map((thread) => ({
    id: thread._id.toString(),
    gmailThreadId: thread.gmailThreadId,
    subject: thread.subject,
    snippet: thread.snippet,
    participants: thread.participants,
    unreadCount: thread.unreadCount,
    messageCount: thread.messageCount,
    labels: thread.labels,
    lastMessageAt: thread.lastMessageAt,
    syncedAt: thread.syncedAt,
  }));
}

export async function getInboxThread(threadId) {
  const thread = await InboxThread.findById(threadId).lean();
  if (!thread) {
    throw Object.assign(new Error('Inbox thread not found'), { status: 404 });
  }

  const messages = await InboxMessage.find({
    connectionKey: SHARED_CONNECTION_KEY,
    gmailThreadId: thread.gmailThreadId,
  })
    .sort({ internalDate: 1 })
    .lean();

  return {
    thread: {
      id: thread._id.toString(),
      gmailThreadId: thread.gmailThreadId,
      subject: thread.subject,
      snippet: thread.snippet,
      participants: thread.participants,
      unreadCount: thread.unreadCount,
      messageCount: thread.messageCount,
      labels: thread.labels,
      lastMessageAt: thread.lastMessageAt,
      syncedAt: thread.syncedAt,
    },
    messages: messages.map((message) => ({
      id: message._id.toString(),
      gmailMessageId: message.gmailMessageId,
      gmailThreadId: message.gmailThreadId,
      from: message.from,
      to: message.to,
      cc: message.cc,
      subject: message.subject,
      snippet: message.snippet,
      plainTextBody: message.plainTextBody,
      htmlBody: message.htmlBody,
      labels: message.labels,
      internalDate: message.internalDate,
      isInbound: message.isInbound,
      syncedAt: message.syncedAt,
    })),
  };
}

export async function markThreadRead(threadId, actorEmail) {
  const connection = await getAuthorizedConnection();
  const thread = await InboxThread.findById(threadId).lean();
  if (!thread) {
    throw Object.assign(new Error('Inbox thread not found'), { status: 404 });
  }

  const unreadMessages = await InboxMessage.find({
    connectionKey: SHARED_CONNECTION_KEY,
    gmailThreadId: thread.gmailThreadId,
    labels: 'UNREAD',
  }).lean();

  if (unreadMessages.length > 0) {
    await removeUnreadFromThread(
      connection.accessToken,
      unreadMessages.map((message) => message.gmailMessageId),
    );
    await InboxMessage.updateMany(
      {
        connectionKey: SHARED_CONNECTION_KEY,
        gmailThreadId: thread.gmailThreadId,
      },
      { $pull: { labels: 'UNREAD' } },
    );
    await InboxThread.findByIdAndUpdate(threadId, { unreadCount: 0 });
  }

  await appendAuditEntry({
    action: 'Inbox тред позначено прочитаним',
    detail: `Тред ${thread.subject} позначено як прочитаний.`,
    actor: actorEmail,
    severity: 'info',
  });

  return { ok: true };
}

export async function replyToThread(threadId, body, actorEmail) {
  if (!body || !body.trim()) {
    throw Object.assign(new Error('Reply body is required'), { status: 400 });
  }

  const connection = await getAuthorizedConnection();
  const thread = await InboxThread.findById(threadId).lean();
  if (!thread) {
    throw Object.assign(new Error('Inbox thread not found'), { status: 404 });
  }

  const messages = await InboxMessage.find({
    connectionKey: SHARED_CONNECTION_KEY,
    gmailThreadId: thread.gmailThreadId,
  })
    .sort({ internalDate: 1 })
    .lean();

  if (!messages.length) {
    throw Object.assign(new Error('Inbox thread has no stored messages'), {
      status: 400,
    });
  }

  const target = chooseReplyTarget(messages, connection.mailboxEmail);
  if (!target || !target.from) {
    throw Object.assign(new Error('Unable to determine reply recipient'), {
      status: 400,
    });
  }

  const latest = messages[messages.length - 1];
  await sendThreadReply(connection.accessToken, {
    from: connection.mailboxEmail,
    to: target.from,
    subject: thread.subject || latest.subject || '(Без теми)',
    text: body.trim(),
    inReplyTo: latest.gmailMessageId,
    references: messages.map((message) => message.gmailMessageId).join(' '),
    threadId: thread.gmailThreadId,
  });

  await appendAuditEntry({
    action: 'Надіслано відповідь з inbox',
    detail: `Для треду ${thread.subject} надіслано відповідь зі спільної Gmail-скриньки.`,
    actor: actorEmail,
    severity: 'security',
  });

  await syncInbox(actorEmail);
  return { ok: true };
}
