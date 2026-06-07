import User from '../../models/User.js';
import Law from '../../models/Law.js';
import { getAuditLog, getAuditCount } from './audit.service.js';
import { getActiveCode, getCodeHistory } from './superCode.service.js';

export const getDashboardSnapshot = async (sessionRole = 'admin') => {
  const [users, laws, auditLog, auditCount, activeSuperCode, superCodeHistory] =
    await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).lean(),
      Law.find()
        .select('shortNumber title createdAt')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      getAuditLog({ limit: 100 }),
      getAuditCount(),
      getActiveCode(),
      getCodeHistory(),
    ]);

  const totalAccounts = users.length;
  const clientAccounts = users.filter((u) => u.role !== 'admin').length;
  const adminAccounts = users.filter((u) => u.role === 'admin').length;

  const billingCounts = users.reduce(
    (acc, u) => {
      if (u.role === 'admin') {
        acc.admin += 1;
        return acc;
      }
      acc[u.billingPlan ?? 'preview'] =
        (acc[u.billingPlan ?? 'preview'] ?? 0) + 1;
      return acc;
    },
    { preview: 0, trial: 0, user: 0, plus: 0, pro: 0, admin: 0 },
  );

  return {
    totalAccounts,
    clientAccounts,
    adminAccounts,
    protectedRoutes: 7,
    activeSessionRole: sessionRole,
    billingCounts,
    latestUsers: users.slice(0, 8),
    recentLaws: laws,
    auditLog,
    auditCount,
    activeSuperCode,
    superCodeHistory,
    accessMatrix: [
      {
        role: 'Гість',
        home: true,
        laws: true,
        subjects: true,
        search: true,
        account: false,
        adminPanel: false,
        legislatorCabinet: false,
      },
      {
        role: 'Клієнт',
        home: true,
        laws: true,
        subjects: true,
        search: true,
        account: true,
        adminPanel: false,
        legislatorCabinet: false,
      },
      {
        role: 'Законотворець',
        home: true,
        laws: true,
        subjects: true,
        search: true,
        account: true,
        adminPanel: false,
        legislatorCabinet: true,
      },
      {
        role: 'Адмін',
        home: true,
        laws: true,
        subjects: true,
        search: true,
        account: true,
        adminPanel: true,
        legislatorCabinet: true,
      },
    ],
  };
};
