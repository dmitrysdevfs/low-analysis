import * as usersService from '../../services/admin/users.service.js';

export const listUsers = async (req, res, next) => {
  try {
    const users = await usersService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const setStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const user = await usersService.setUserStatus(id, status, req.user.email);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const setRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await usersService.setUserRole(id, role, req.user.email);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const setBilling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { billingPlan } = req.body;
    const user = await usersService.setUserBilling(
      id,
      billingPlan,
      req.user.email,
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const forceLogout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await usersService.recordForceLogout(id, req.user.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
