import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

function isLocalMongoUri(uri = '') {
  return /mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);
}

if (
  !process.env.JWT_SECRET &&
  process.env.NODE_ENV === 'development' &&
  isLocalMongoUri(process.env.MONGODB_URI)
) {
  process.env.JWT_SECRET = 'local-dev-jwt-secret-low-analysis';
  console.warn(
    '[dev-auth] JWT_SECRET missing in backend/.env; using local development fallback secret.',
  );
}
