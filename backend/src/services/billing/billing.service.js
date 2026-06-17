import BillingSubscription from '../../models/BillingSubscription.js';
import BillingTransaction from '../../models/BillingTransaction.js';
import User from '../../models/User.js';

const BILLING_PLANS = [
  {
    id: 'trial',
    label: 'Starter',
    priceUsd: 1,
    durationDays: 7,
    isUnlimited: true,
    quotaSearch: null,
    quotaView: null,
  },
  {
    id: 'user',
    label: 'Basic',
    priceUsd: 9,
    durationDays: 30,
    isUnlimited: false,
    quotaSearch: 100,
    quotaView: 200,
  },
  {
    id: 'plus',
    label: 'Plus',
    priceUsd: 19,
    durationDays: 30,
    isUnlimited: false,
    quotaSearch: 500,
    quotaView: 1000,
  },
  {
    id: 'pro',
    label: 'Pro',
    priceUsd: 39,
    durationDays: 30,
    isUnlimited: true,
    quotaSearch: null,
    quotaView: null,
  },
];

const PLAN_MAP = new Map(BILLING_PLANS.map((plan) => [plan.id, plan]));

function ensureValidPlanId(planId) {
  if (!PLAN_MAP.has(planId)) {
    throw Object.assign(new Error('Invalid planId'), { status: 400 });
  }
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDefaultSubscription(userId) {
  return {
    userId,
    planId: null,
    status: 'inactive',
    usageSearch: 0,
    usageView: 0,
    startedAt: null,
    endsAt: null,
  };
}

function toUsageSnapshot(subscription) {
  return {
    search: subscription?.usageSearch ?? 0,
    view: subscription?.usageView ?? 0,
  };
}

export function listBillingPlans() {
  return BILLING_PLANS;
}

export async function getBillingOverview(userId) {
  const subscription =
    (await BillingSubscription.findOne({ userId }).lean()) ??
    buildDefaultSubscription(userId);

  const transactions = await BillingTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return { subscription, transactions };
}

export async function consumeBillingQuota(userId, type) {
  if (!['search', 'view'].includes(type)) {
    throw Object.assign(new Error('Invalid usage type'), { status: 400 });
  }

  const field = type === 'search' ? 'usageSearch' : 'usageView';
  const quotaField = type === 'search' ? 'quotaSearch' : 'quotaView';

  const current = await BillingSubscription.findOne({ userId }).lean();
  if (current) {
    const plan = PLAN_MAP.get(current.planId);
    if (plan && !plan.isUnlimited && plan[quotaField] !== null) {
      const used = current[field] ?? 0;
      if (used >= plan[quotaField]) {
        throw Object.assign(
          new Error(`Ліміт ${type} вичерпано для вашого плану`),
          { status: 429 },
        );
      }
    }
  }

  const subscription = await BillingSubscription.findOneAndUpdate(
    { userId },
    { $inc: { [field]: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return toUsageSnapshot(subscription);
}

export async function checkoutDemoPlan(userId, planId, method = 'card') {
  ensureValidPlanId(planId);

  if (planId === 'trial') {
    const existingTrial = await BillingTransaction.findOne({
      userId,
      planId: 'trial',
      status: 'completed',
    });

    if (existingTrial) {
      throw Object.assign(new Error('Пробний план вже використано'), {
        status: 400,
      });
    }
  }

  const plan = PLAN_MAP.get(planId);
  const now = new Date();
  const status = planId === 'trial' ? 'trialing' : 'active';

  const subscription = await BillingSubscription.findOneAndUpdate(
    { userId },
    {
      planId,
      status,
      usageSearch: 0,
      usageView: 0,
      startedAt: now,
      endsAt: addDays(now, plan.durationDays),
      lastPaymentMethod: method,
      lastPaymentAt: now,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const transaction = await BillingTransaction.create({
    userId,
    planId,
    amount: plan.priceUsd,
    method,
    status: 'completed',
    provider: 'demo',
  });

  return { subscription, transaction };
}

export async function assignPlanAsAdmin(adminUser, targetUserId, planId) {
  ensureValidPlanId(planId);

  const targetUser = await User.findById(targetUserId).lean();
  if (!targetUser) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const plan = PLAN_MAP.get(planId);
  const now = new Date();
  const status = planId === 'trial' ? 'trialing' : 'active';

  const subscription = await BillingSubscription.findOneAndUpdate(
    { userId: targetUserId },
    {
      planId,
      status,
      usageSearch: 0,
      usageView: 0,
      startedAt: now,
      endsAt: addDays(now, plan.durationDays),
      lastPaymentMethod: 'admin_override',
      lastPaymentAt: now,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const transaction = await BillingTransaction.create({
    userId: targetUserId,
    planId,
    amount: 0,
    method: 'admin_override',
    status: 'completed',
    provider: 'demo',
    actorId: adminUser?._id ?? null,
    actorEmail: adminUser?.email ?? null,
  });

  return { subscription, transaction };
}
