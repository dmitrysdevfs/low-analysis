import { ensureSupportVisitorId, readSupportVisitorId } from './support.cookies.js';
import { verifyTelegramWebhook } from './support.telegram.service.js';
import * as supportService from './support.service.js';

export const getConfig = async (_req, res, next) => {
  try {
    const config = await supportService.getSupportConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
};

export const getCurrentConversation = async (req, res, next) => {
  try {
    const data = await supportService.getCurrentConversation({
      user: req.user,
      visitorId: readSupportVisitorId(req),
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const visitorId = req.user ? null : ensureSupportVisitorId(req, res);
    const { text, guestName, guestEmail, pathname, pageTitle, lawId, articleNum } =
      req.body ?? {};

    const data = await supportService.postVisitorMessage({
      user: req.user,
      visitorId,
      guestName,
      guestEmail,
      text,
      pathname,
      pageTitle,
      lawId,
      articleNum,
    });

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const result = await supportService.markConversationReadForUser({
      conversationId: req.params.id,
      user: req.user,
      visitorId: readSupportVisitorId(req),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const handleTelegramWebhook = async (req, res, next) => {
  try {
    if (!verifyTelegramWebhook(req)) {
      return res.status(403).json({ message: 'Invalid Telegram webhook secret' });
    }
    const result = await supportService.handleTelegramUpdate(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
