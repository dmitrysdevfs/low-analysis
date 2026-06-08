import * as inboxService from '../../services/admin/inbox/inbox.service.js';

function buildRedirectUrl(baseUrl, status, mailboxEmail = '') {
  const fallback = '/admin/inbox';
  try {
    const url = new URL(baseUrl || fallback, 'http://localhost');
    url.searchParams.set('gmail', status);
    if (mailboxEmail) {
      url.searchParams.set('mailbox', mailboxEmail);
    }
    if (!baseUrl) {
      return `${fallback}?${url.searchParams.toString()}`;
    }
    if (/^https?:\/\//i.test(baseUrl)) {
      return url.toString();
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return `${fallback}?gmail=${encodeURIComponent(status)}`;
  }
}

export const getStatus = async (req, res, next) => {
  try {
    const status = await inboxService.getInboxStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
};

export const startConnect = async (req, res, next) => {
  try {
    const { returnTo } = req.body ?? {};
    const result = await inboxService.createConnectUrl(
      req.user.email,
      returnTo,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const completeConnect = async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    const returnTo = req.query.returnTo
      ? String(req.query.returnTo)
      : undefined;
    return res.redirect(buildRedirectUrl(returnTo, 'error'));
  }

  try {
    const result = await inboxService.completeConnect(
      String(code),
      String(state),
    );
    return res.redirect(
      buildRedirectUrl(result.returnTo, 'connected', result.mailboxEmail),
    );
  } catch {
    return res.redirect(buildRedirectUrl(undefined, 'error'));
  }
};

export const disconnect = async (req, res, next) => {
  try {
    const result = await inboxService.disconnectInbox(req.user.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const syncInbox = async (req, res, next) => {
  try {
    const result = await inboxService.syncInbox(req.user.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const listThreads = async (req, res, next) => {
  try {
    const threads = await inboxService.listInboxThreads({
      query: req.query.query ? String(req.query.query) : '',
      unreadOnly: req.query.unread === '1',
    });
    res.json(threads);
  } catch (err) {
    next(err);
  }
};

export const getThread = async (req, res, next) => {
  try {
    const thread = await inboxService.getInboxThread(req.params.id);
    res.json(thread);
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const result = await inboxService.markThreadRead(
      req.params.id,
      req.user.email,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const reply = async (req, res, next) => {
  try {
    const result = await inboxService.replyToThread(
      req.params.id,
      req.body?.body,
      req.user.email,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
