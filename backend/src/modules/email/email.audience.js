import User from '../../models/User.js';

export async function buildAudience({ type, roles, billingPlans, customEmails }) {
  if (type === 'custom') {
    return customEmails.map(email => ({ email, name: email }));
  }

  const query = { status: 'active' };
  if (type === 'role' && roles?.length > 0) {
    query.role = { $in: roles };
  }
  if (type === 'billing' && billingPlans?.length > 0) {
    query.billingPlan = { $in: billingPlans };
  }

  const users = await User.find(query).select('email fullName').lean();
  return users.map(u => ({ email: u.email, name: u.fullName || u.email }));
}

export async function previewAudienceCount({ type, roles, billingPlans, customEmails }) {
  if (type === 'custom') {
    return customEmails?.length || 0;
  }

  const query = { status: 'active' };
  if (type === 'role' && roles?.length > 0) {
    query.role = { $in: roles };
  }
  if (type === 'billing' && billingPlans?.length > 0) {
    query.billingPlan = { $in: billingPlans };
  }

  return User.countDocuments(query);
}
