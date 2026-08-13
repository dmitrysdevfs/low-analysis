import { randomBytes } from 'node:crypto';
import AdminConfig from '../../models/AdminConfig.js';
import { appendAuditEntry } from './audit.service.js';

const CODE_KEY = 'adminSuperCode';
const HISTORY_KEY = 'adminSuperCodeHistory';
const DEFAULT_CODE = 'SUPER-001';

// Без I, L, O, U — щоб код не читався неоднозначно, коли його диктують.
// Довжина рівно 32, тож `byte % 32` не дає зсуву: 256 ділиться на 32 без остачі.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
// 30 символів по 5 біт — 150 біт ентропії. Довжина не заважає: код копіюють
// кнопкою в адмінці, а не набирають руками.
const CODE_GROUPS = 5;
const CODE_GROUP_LENGTH = 6;

function generateCode() {
  const bytes = randomBytes(CODE_GROUPS * CODE_GROUP_LENGTH);
  const chars = Array.from(bytes, (byte) => CODE_ALPHABET[byte % 32]);
  const groups = [];
  for (let i = 0; i < CODE_GROUPS; i += 1) {
    groups.push(
      chars.slice(i * CODE_GROUP_LENGTH, (i + 1) * CODE_GROUP_LENGTH).join(''),
    );
  }
  return `LOW-${groups.join('-')}`;
}

export const getActiveCode = async () => {
  const doc = await AdminConfig.findOne({ key: CODE_KEY }).lean();
  return doc?.value ?? DEFAULT_CODE;
};

export const getCodeHistory = async () => {
  const doc = await AdminConfig.findOne({ key: HISTORY_KEY }).lean();
  return doc?.value ?? [];
};

export const rotateCode = async (actor, ipAddress = null) => {
  const nextCode = generateCode();
  const rotatedAt = new Date().toISOString();

  const history = await getCodeHistory();
  // Поля перелічені явно, а не через `...e`: так у історію не потрапить нове
  // чутливе поле, якщо його колись додадуть до запису.
  const retired = history.map((e) => ({
    id: e.id,
    rotatedAt: e.rotatedAt,
    rotatedBy: e.rotatedBy,
    status: 'retired',
  }));
  // Значення коду в історію не потрапляє: чинний код і так лежить у CODE_KEY,
  // а історія потрібна лише для дат і авторства. Інакше доступ до бази давав би
  // не один секрет, а всі попередні.
  const nextEntry = {
    id: `sc-${Date.now()}`,
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
    detail: 'Створено новий код для підключення адміністратора.',
    actor,
    severity: 'security',
    ipAddress,
  });

  return { code: nextCode, rotatedAt };
};
