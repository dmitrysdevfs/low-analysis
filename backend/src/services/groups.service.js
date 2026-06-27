import Group from '../models/Group.js';
import GroupRequest from '../models/GroupRequest.js';

/**
 * Get public active groups with optional search/filter.
 */
export const getPublicGroups = async ({
  page = 1,
  limit = 20,
  search,
  supervisorId,
} = {}) => {
  const query = { status: 'active', visibility: 'public' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { course: { $regex: search, $options: 'i' } },
    ];
  }
  if (supervisorId) {
    query.supervisorId = supervisorId;
  }

  const skip = (page - 1) * limit;
  const [groups, total] = await Promise.all([
    Group.find(query)
      .populate('supervisorId', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Group.countDocuments(query),
  ]);

  return { groups, total, page, limit };
};

/**
 * Create a new group. Supervisor can have at most 3 active groups.
 */
export const createGroup = async ({
  name,
  course,
  supervisorId,
  trackedLaws,
  maxMembers,
  visibility,
}) => {
  const activeCount = await Group.countDocuments({
    supervisorId,
    status: 'active',
  });
  if (activeCount >= 3) {
    const err = new Error('Supervisor cannot have more than 3 active groups');
    err.statusCode = 400;
    throw err;
  }

  const group = await Group.create({
    name,
    course,
    supervisorId,
    trackedLaws: trackedLaws || [],
    maxMembers: maxMembers || 20,
    visibility: visibility || 'public',
  });

  return group;
};

/**
 * Get groups for the authenticated user based on their role.
 */
export const getMyGroups = async (userId, role) => {
  if (role === 'admin') {
    return Group.find({ status: 'active' })
      .populate('supervisorId', 'fullName email')
      .sort({ createdAt: -1 });
  }
  if (role === 'supervisor') {
    return Group.find({ supervisorId: userId })
      .populate('supervisorId', 'fullName email')
      .sort({ createdAt: -1 });
  }
  // legislator: groups where user is an active member
  return Group.find({
    members: { $elemMatch: { userId, status: 'active' } },
    status: 'active',
  })
    .populate('supervisorId', 'fullName email')
    .sort({ createdAt: -1 });
};

/**
 * Get a single group by ID with full population.
 */
export const getGroupById = async (groupId, requestingUserId = null) => {
  const group = await Group.findById(groupId)
    .populate('supervisorId', 'fullName email')
    .populate('members.userId', 'fullName email')
    .populate('trackedLaws', 'title code');

  if (!group) return null;

  if (group.visibility === 'invite_only' && requestingUserId) {
    const isMember = group.members.some(
      (m) => String(m.userId?._id || m.userId) === String(requestingUserId),
    );
    const isSupervisor =
      String(group.supervisorId) === String(requestingUserId);
    if (!isMember && !isSupervisor) {
      const err = new Error('Access denied: group is invite only');
      err.statusCode = 403;
      throw err;
    }
  }

  return group;
};

/**
 * Update group fields. Only the owning supervisor can update.
 */
export const updateGroup = async (groupId, supervisorId, data) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  if (String(group.supervisorId) !== String(supervisorId)) {
    const err = new Error('Not authorized to update this group');
    err.statusCode = 403;
    throw err;
  }

  // Prevent changing supervisorId or members via this endpoint
  const { supervisorId: _s, members: _m, ...safeData } = data;
  return Group.findByIdAndUpdate(groupId, safeData, { new: true });
};

/**
 * Archive a group. Only the owning supervisor can archive.
 */
export const archiveGroup = async (groupId, supervisorId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  if (String(group.supervisorId) !== String(supervisorId)) {
    const err = new Error('Not authorized to archive this group');
    err.statusCode = 403;
    throw err;
  }

  return Group.findByIdAndUpdate(
    groupId,
    { status: 'archived' },
    { new: true },
  );
};

/**
 * Get all pending requests submitted by the current user across all groups.
 */
export const getMyRequests = async (userId) => {
  return GroupRequest.find({ userId, status: 'pending' })
    .populate('groupId', 'name course')
    .sort({ createdAt: -1 });
};

/**
 * Submit a join request for a group.
 */
export const createRequest = async (
  groupId,
  userId,
  message,
  role = 'user',
) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  if (group.status !== 'active') {
    const err = new Error('Cannot join an inactive group');
    err.statusCode = 400;
    throw err;
  }

  if (String(group.supervisorId) === String(userId) && role !== 'admin') {
    const err = new Error('Supervisor cannot join their own group');
    err.statusCode = 403;
    throw err;
  }

  const isAlreadyMember = group.members.some(
    (m) => String(m.userId) === String(userId) && m.status === 'active',
  );
  if (isAlreadyMember) {
    const err = new Error('You are already a member of this group');
    err.statusCode = 400;
    throw err;
  }

  const existingRequest = await GroupRequest.findOne({
    groupId,
    userId,
    status: 'pending',
  });
  if (existingRequest) {
    const err = new Error('You already have a pending request for this group');
    err.statusCode = 400;
    throw err;
  }

  const activeMembers = group.members.filter(
    (m) => m.status === 'active',
  ).length;
  if (activeMembers >= group.maxMembers) {
    const err = new Error('Group is full');
    err.statusCode = 400;
    throw err;
  }

  return GroupRequest.create({ groupId, userId, message });
};

/**
 * Get all requests for a group. Caller must be the group's supervisor.
 */
export const getGroupRequests = async (groupId, supervisorId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  if (String(group.supervisorId) !== String(supervisorId)) {
    const err = new Error('Not authorized to view requests for this group');
    err.statusCode = 403;
    throw err;
  }

  return GroupRequest.find({ groupId })
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });
};

/**
 * Approve or reject a join request. Caller must be the group's supervisor.
 */
export const reviewRequest = async (groupId, reqId, supervisorId, action) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  if (String(group.supervisorId) !== String(supervisorId)) {
    const err = new Error('Not authorized to review requests for this group');
    err.statusCode = 403;
    throw err;
  }

  const request = await GroupRequest.findById(reqId);
  if (!request || String(request.groupId) !== String(groupId)) {
    const err = new Error('Request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== 'pending') {
    const err = new Error('Request is no longer pending');
    err.statusCode = 400;
    throw err;
  }

  if (action === 'approve') {
    const activeMembers = group.members.filter(
      (m) => m.status === 'active',
    ).length;
    if (activeMembers >= group.maxMembers) {
      const err = new Error('Group is full');
      err.statusCode = 400;
      throw err;
    }
    await Group.findByIdAndUpdate(groupId, {
      $push: {
        members: {
          userId: request.userId,
          joinedAt: new Date(),
          status: 'active',
        },
      },
    });
    request.status = 'approved';
  } else if (action === 'reject') {
    request.status = 'rejected';
  } else {
    const err = new Error('Invalid action. Use "approve" or "reject"');
    err.statusCode = 400;
    throw err;
  }

  request.reviewedBy = supervisorId;
  request.reviewedAt = new Date();
  await request.save();

  return request;
};

/**
 * Cancel a pending request. Only the requester can cancel.
 */
export const cancelRequest = async (reqId, userId) => {
  const request = await GroupRequest.findById(reqId);
  if (!request) {
    const err = new Error('Request not found');
    err.statusCode = 404;
    throw err;
  }
  if (String(request.userId) !== String(userId)) {
    const err = new Error('Not authorized to cancel this request');
    err.statusCode = 403;
    throw err;
  }
  if (request.status !== 'pending') {
    const err = new Error('Only pending requests can be cancelled');
    err.statusCode = 400;
    throw err;
  }

  request.status = 'cancelled';
  await request.save();
  return request;
};

/**
 * Remove a member from a group.
 * Caller must be the supervisor OR the member themselves (self-leave).
 */
export const removeMember = async (groupId, memberId, callerId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  const isSupervisor = String(group.supervisorId) === String(callerId);
  const isSelf = String(memberId) === String(callerId);

  if (!isSupervisor && !isSelf) {
    const err = new Error('Not authorized to remove this member');
    err.statusCode = 403;
    throw err;
  }

  const memberExists = group.members.some(
    (m) => String(m.userId) === String(memberId),
  );
  if (!memberExists) {
    const err = new Error('Member not found in this group');
    err.statusCode = 404;
    throw err;
  }

  return Group.findByIdAndUpdate(
    groupId,
    { $pull: { members: { userId: memberId } } },
    { new: true },
  );
};

/**
 * Get recent activity for a group (stub — returns empty arrays).
 */
export const getGroupActivity = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  const isSupervisor = userId && String(group.supervisorId) === String(userId);
  const isMember =
    userId &&
    group.members.some(
      (m) => String(m.userId?._id || m.userId) === String(userId),
    );

  if (userId && !isSupervisor && !isMember) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return {
    recentForks: [],
    recentProposals: [],
    members: group.members,
  };
};
