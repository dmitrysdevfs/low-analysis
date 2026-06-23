import * as groupChatService from './groupChat.service.js';

export const getMyRooms = async (req, res, next) => {
  try {
    const rooms = await groupChatService.getMyRooms(req.user._id);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { before, limit } = req.query;
    const result = await groupChatService.getMessages(
      groupId,
      req.user._id,
      before,
      limit ? Number(limit) : 50,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    await groupChatService.markRead(req.params.groupId, req.user._id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
