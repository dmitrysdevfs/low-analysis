import LegislatorAccessRequest from '../../models/LegislatorAccessRequest.js';
import User from '../../models/User.js';

const COOLDOWN_HOURS = 24;

export const submitRequest = async (
  userId,
  { organization, reason, requestedRole = 'legislator' },
) => {
  const existing = await LegislatorAccessRequest.findOne({
    userId,
    status: 'pending',
  });
  if (existing)
    throw Object.assign(new Error('You already have a pending request'), {
      status: 409,
    });

  const lastRejected = await LegislatorAccessRequest.findOne({
    userId,
    status: 'rejected',
  }).sort({ updatedAt: -1 });

  if (lastRejected?.updatedAt) {
    const msSinceRejection =
      Date.now() - new Date(lastRejected.updatedAt).getTime();
    const cooldownMs = COOLDOWN_HOURS * 3_600_000;
    if (msSinceRejection < cooldownMs) {
      throw Object.assign(
        new Error('Повторний запит можливий через 24 години після відмови'),
        { status: 429, retryAfterMs: cooldownMs - msSinceRejection },
      );
    }
  }

  const lastRevoked = await LegislatorAccessRequest.findOne({
    userId,
    status: 'revoked',
  }).sort({ updatedAt: -1 });

  if (lastRevoked?.updatedAt) {
    const msSinceRevocation =
      Date.now() - new Date(lastRevoked.updatedAt).getTime();
    const cooldownMs = COOLDOWN_HOURS * 3_600_000;
    if (msSinceRevocation < cooldownMs) {
      throw Object.assign(
        new Error('Повторний запит можливий через 24 години після відкликання ролі'),
        { status: 429, retryAfterMs: cooldownMs - msSinceRevocation },
      );
    }
  }

  return await LegislatorAccessRequest.create({
    userId,
    requestedRole,
    organization,
    reason,
  });
};

export const getMyRequest = async (userId) => {
  return await LegislatorAccessRequest.findOne({ userId }).sort({
    createdAt: -1,
  });
};

export const getAllRequests = async ({ status } = {}) => {
  const query = status ? { status } : {};
  return await LegislatorAccessRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'fullName email role')
    .populate('reviewedBy', 'fullName');
};

export const approveRequest = async (id, adminId) => {
  const request = await LegislatorAccessRequest.findById(id);
  if (!request)
    throw Object.assign(new Error('Request not found'), { status: 404 });
  if (request.status !== 'pending')
    throw Object.assign(new Error('Request is not pending'), { status: 400 });

  request.status = 'approved';
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.userId, { role: request.requestedRole });
  return request;
};

export const rejectRequest = async (id, adminId, adminNote = '') => {
  const request = await LegislatorAccessRequest.findById(id);
  if (!request)
    throw Object.assign(new Error('Request not found'), { status: 404 });
  if (request.status !== 'pending')
    throw Object.assign(new Error('Request is not pending'), { status: 400 });

  request.status = 'rejected';
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.adminNote = adminNote;
  return await request.save();
};

export const revokeRole = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { role: 'user' },
    { new: true },
  ).select('-password');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  await LegislatorAccessRequest.updateMany(
    { userId, status: 'approved' },
    { status: 'revoked' },
  );

  return user;
};
