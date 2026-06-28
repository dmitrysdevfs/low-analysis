import crypto from 'crypto';
import GroupInvite from '../models/GroupInvite.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function makeError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

async function resolveInvite(token) {
  const invite = await GroupInvite.findOne({ token }).populate(
    'groupId',
    'name course status supervisorId members maxMembers',
  );
  if (!invite) throw makeError('Invite not found', 404);
  if (invite.status === 'revoked') throw makeError('Invite has been revoked', 410);
  if (invite.expiresAt < new Date()) throw makeError('Invite has expired', 410);
  return invite;
}

async function addMemberToGroup(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw makeError('Group not found', 404);

  const isAlreadyMember = group.members.some(
    (m) => String(m.userId) === String(userId) && m.status === 'active',
  );
  if (isAlreadyMember) return { alreadyMember: true };

  const activeMembers = group.members.filter((m) => m.status === 'active').length;
  if (activeMembers >= group.maxMembers) throw makeError('Group is full', 400);

  await Group.findByIdAndUpdate(groupId, {
    $push: { members: { userId, joinedAt: new Date(), status: 'active' } },
  });
  return { alreadyMember: false };
}

export async function createInvite(groupId, supervisorId) {
  const group = await Group.findById(groupId);
  if (!group) throw makeError('Group not found', 404);
  if (String(group.supervisorId) !== String(supervisorId))
    throw makeError('Not authorized to create invites for this group', 403);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const invite = await GroupInvite.create({
    groupId,
    token: rawToken,
    createdBy: supervisorId,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });
  return invite;
}

export async function getInviteByToken(token) {
  const invite = await resolveInvite(token);
  const group = invite.groupId;
  return {
    groupId: group._id,
    groupName: group.name,
    groupCourse: group.course || '',
  };
}

export async function joinByInvite(token, userId) {
  const invite = await resolveInvite(token);

  const { alreadyMember } = await addMemberToGroup(invite.groupId._id, userId);

  // Upgrade role: user → legislator (never downgrade supervisor/admin)
  const user = await User.findById(userId);
  if (user && user.role === 'user') {
    user.role = 'legislator';
    await user.save();
  }

  if (!alreadyMember) {
    await GroupInvite.findByIdAndUpdate(invite._id, {
      $addToSet: { usedBy: userId },
    });
  }

  return {
    groupId: invite.groupId._id,
    groupName: invite.groupId.name,
    alreadyMember,
  };
}

export async function registerAndJoin(token, { email, password, fullName }) {
  const invite = await resolveInvite(token);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw makeError('Email вже використовується', 400);

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    fullName,
    role: 'legislator',
    isVerified: true,
  });

  await addMemberToGroup(invite.groupId._id, user._id);

  await GroupInvite.findByIdAndUpdate(invite._id, {
    $addToSet: { usedBy: user._id },
  });

  return { user, groupId: invite.groupId._id, groupName: invite.groupId.name };
}
