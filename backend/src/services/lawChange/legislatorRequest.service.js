import LegislatorAccessRequest from '../../models/LegislatorAccessRequest.js';
import User from '../../models/User.js';

export const submitRequest = async (userId, { organization, reason }) => {
  const existing = await LegislatorAccessRequest.findOne({
    user_id: userId,
    status: 'pending',
  });
  if (existing)
    throw Object.assign(new Error('You already have a pending request'), {
      status: 409,
    });

  return await LegislatorAccessRequest.create({
    user_id: userId,
    organization,
    reason,
  });
};

export const getMyRequest = async (userId) => {
  return await LegislatorAccessRequest.findOne({ user_id: userId }).sort({
    createdAt: -1,
  });
};

export const getAllRequests = async ({ status } = {}) => {
  const query = status ? { status } : {};
  return await LegislatorAccessRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('user_id', 'fullName email role')
    .populate('reviewed_by', 'fullName');
};

export const approveRequest = async (id, adminId) => {
  const request = await LegislatorAccessRequest.findById(id);
  if (!request)
    throw Object.assign(new Error('Request not found'), { status: 404 });
  if (request.status !== 'pending')
    throw Object.assign(new Error('Request is not pending'), { status: 400 });

  request.status = 'approved';
  request.reviewed_by = adminId;
  await request.save();

  await User.findByIdAndUpdate(request.user_id, { role: 'legislator' });
  return request;
};

export const rejectRequest = async (id, adminId, review_note = '') => {
  const request = await LegislatorAccessRequest.findById(id);
  if (!request)
    throw Object.assign(new Error('Request not found'), { status: 404 });
  if (request.status !== 'pending')
    throw Object.assign(new Error('Request is not pending'), { status: 400 });

  request.status = 'rejected';
  request.reviewed_by = adminId;
  request.review_note = review_note;
  return await request.save();
};

export const setUserRole = async (userId, role) => {
  const allowed = ['user', 'paid_user', 'legislator', 'admin'];
  if (!allowed.includes(role))
    throw Object.assign(new Error(`Invalid role: ${role}`), { status: 400 });

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true },
  ).select('-password');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
};
