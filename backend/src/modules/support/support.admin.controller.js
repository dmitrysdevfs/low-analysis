import * as supportService from './support.service.js';

export const getStatus = async (_req, res, next) => {
  try {
    const status = await supportService.getAdminSupportStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await supportService.listAdminConversations({
      query: String(req.query.query ?? ''),
      status: String(req.query.status ?? 'all'),
    });
    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversation = await supportService.getAdminConversation(
      req.params.id,
    );
    res.json(conversation);
  } catch (err) {
    next(err);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const result = await supportService.markConversationReadForAdmin(
      req.params.id,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const result = await supportService.postAdminMessage({
      conversationId: req.params.id,
      adminUser: req.user,
      text: req.body?.text,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const result = await supportService.updateConversationStatus({
      conversationId: req.params.id,
      status: req.body?.status,
      adminUser: req.user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const assignConversation = async (req, res, next) => {
  try {
    const result = await supportService.assignConversation({
      conversationId: req.params.id,
      adminId: req.body?.adminId ?? null,
      adminUser: req.user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const markAsSpam = async (req, res, next) => {
  try {
    const result = await supportService.markAsSpam({
      conversationId: req.params.id,
      adminUser: req.user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const escalateConversation = async (req, res, next) => {
  try {
    const result = await supportService.escalateConversation({
      conversationId: req.params.id,
      adminUser: req.user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const listNotes = async (req, res, next) => {
  try {
    const notes = await supportService.listInternalNotes(req.params.id);
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

export const addNote = async (req, res, next) => {
  try {
    const result = await supportService.addInternalNote({
      conversationId: req.params.id,
      adminUser: req.user,
      text: req.body?.text,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const syncCheck = async (_req, res, next) => {
  try {
    const result = await supportService.checkTelegramSync();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
