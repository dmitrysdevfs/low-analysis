import Group from '../../models/Group.js';
import GroupChatMessage from '../../models/GroupChatMessage.js';
import GroupChatReadState from '../../models/GroupChatReadState.js';

const isAuthorized = async (groupId, userId) => {
  const [isSuper, isMember] = await Promise.all([
    Group.exists({ _id: groupId, supervisorId: userId, status: 'active' }),
    Group.exists({
      _id: groupId,
      'members.userId': userId,
      'members.status': 'active',
      status: 'active',
    }),
  ]);
  return isSuper || isMember;
};

export const getMyRooms = async (userId) => {
  const [asSuper, asMember] = await Promise.all([
    Group.find({ supervisorId: userId, status: 'active' })
      .select('_id name course')
      .lean(),
    Group.find({
      'members.userId': userId,
      'members.status': 'active',
      status: 'active',
    })
      .select('_id name course supervisorId')
      .lean(),
  ]);

  const seen = new Set();
  const allGroups = [...asSuper, ...asMember].filter((g) => {
    const id = String(g._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const groupIds = allGroups.map((g) => g._id);

  const [lastMessages, readStates] = await Promise.all([
    GroupChatMessage.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$groupId', lastMessage: { $first: '$$ROOT' } } },
    ]),
    GroupChatReadState.find({ groupId: { $in: groupIds }, userId }).lean(),
  ]);

  const lastMsgMap = new Map(
    lastMessages.map((r) => [String(r._id), r.lastMessage]),
  );
  const readMap = new Map(
    readStates.map((r) => [String(r.groupId), r.lastReadAt]),
  );

  const rooms = await Promise.all(
    allGroups.map(async (g) => {
      const gid = String(g._id);
      const lastMsg = lastMsgMap.get(gid) ?? null;
      const lastReadAt = readMap.get(gid) ?? new Date(0);
      const unreadCount = await GroupChatMessage.countDocuments({
        groupId: g._id,
        createdAt: { $gt: lastReadAt },
      });
      return {
        groupId: gid,
        name: g.name,
        course: g.course ?? '',
        lastMessage: lastMsg
          ? {
              text: lastMsg.text,
              senderName: lastMsg.senderName,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unreadCount,
      };
    }),
  );

  return rooms;
};

export const getMessages = async (groupId, userId, before, limit = 50) => {
  const ok = await isAuthorized(groupId, userId);
  if (!ok)
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });

  const query = { groupId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const rows = await GroupChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  return { messages: rows.reverse(), hasMore };
};

export const saveMessage = async (groupId, senderId, senderName, text) => {
  return GroupChatMessage.create({ groupId, senderId, senderName, text });
};

export const markRead = async (groupId, userId) => {
  await GroupChatReadState.findOneAndUpdate(
    { groupId, userId },
    { lastReadAt: new Date() },
    { upsert: true, new: true },
  );
};
