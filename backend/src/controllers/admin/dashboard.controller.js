import { getDashboardSnapshot } from '../../services/admin/dashboard.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const sessionRole = req.user?.role ?? 'admin';
    const snapshot = await getDashboardSnapshot(sessionRole);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
};
