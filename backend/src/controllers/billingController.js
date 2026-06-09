import * as billingService from '../services/billing/billing.service.js';

export const getPlans = (_req, res) => {
  res.json(billingService.listBillingPlans());
};

export const getMyBilling = async (req, res, next) => {
  try {
    const result = await billingService.getBillingOverview(
      String(req.user._id),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const consumeQuota = async (req, res, next) => {
  try {
    const usage = await billingService.consumeBillingQuota(
      String(req.user._id),
      req.body?.type,
    );
    res.json({ ok: true, usage });
  } catch (err) {
    next(err);
  }
};

export const checkoutDemo = async (req, res, next) => {
  try {
    const { planId, method } = req.body ?? {};
    const result = await billingService.checkoutDemoPlan(
      String(req.user._id),
      planId,
      method,
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const assignPlan = async (req, res, next) => {
  try {
    const { planId } = req.body ?? {};
    const result = await billingService.assignPlanAsAdmin(
      req.user,
      req.params.userId,
      planId,
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};
