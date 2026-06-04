import AdminConfig from '../../models/AdminConfig.js';
import { appendAuditEntry } from './audit.service.js';

const CODE_KEY = 'adminSuperCode';
const HISTORY_KEY = 'adminSuperCodeHistory';
const DEFAULT_CODE = 'SUPER-001';

function generateCode() {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LOW-${seg()}-${seg()}`;
}

export const getActiveCode = async () => {
  const doc = await AdminConfig.findOne({ key: CODE_KEY }).lean();
  return doc?.value ?? DEFAULT_CODE;
};

export const getCodeHistory = async () => {
  const doc = await AdminConfig.findOne({ key: HISTORY_KEY }).lean();
  return doc?.value ?? [];
};

export const rotateCode = async (actor) => {
  const nextCode = generateCode();
  const rotatedAt = new Date().toISOString();

  const history = await getCodeHistory();
  const retired = history.map((e) => ({ ...e, status: 'retired' }));
  const nextEntry = {
    id: `sc-${Date.now()}`,
    code: nextCode,
    rotatedAt,
    rotatedBy: actor,
    status: 'active',
  };
  const nextHistory = [nextEntry, ...retired].slice(0, 8);

  await AdminConfig.findOneAndUpdate(
    { key: CODE_KEY },
    { value: nextCode },
    { upsert: true },
  );
  await AdminConfig.findOneAndUpdate(
    { key: HISTORY_KEY },
    { value: nextHistory },
    { upsert: true },
  );

  await appendAuditEntry({
    action: 'Супер-код оновлено',
    detail: `Створено новий код для підключення адміністратора: ${nextCode}.`,
    actor,
    severity: 'security',
  });

  return { code: nextCode, rotatedAt };
};
