import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const DEV_ADMIN_EMAIL = 'admin@low-analysis.dev';
const DEV_ADMIN_USERNAME = 'admin';
const DEV_ADMIN_PASSWORD = '888';
const DEV_ADMIN_FULL_NAME = 'Dev Admin';

function isLocalMongoUri(uri) {
  return /mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(uri);
}

export async function ensureLocalDevAdmin() {
  const mongoUri = process.env.MONGODB_URI ?? '';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment || !isLocalMongoUri(mongoUri)) {
    return;
  }

  const user = await User.findOne({
    $or: [{ email: DEV_ADMIN_EMAIL }, { username: DEV_ADMIN_USERNAME }],
  }).select('+password');

  const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 10);

  if (!user) {
    const now = new Date();
    await User.collection.insertOne({
      fullName: DEV_ADMIN_FULL_NAME,
      email: DEV_ADMIN_EMAIL,
      username: DEV_ADMIN_USERNAME,
      password: passwordHash,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    });

    console.log(
      '[dev-auth] Local admin account created: admin / admin@low-analysis.dev',
    );
    return;
  }

  let hasChanges = false;

  if (user.fullName !== DEV_ADMIN_FULL_NAME) {
    user.fullName = DEV_ADMIN_FULL_NAME;
    hasChanges = true;
  }

  if (user.email !== DEV_ADMIN_EMAIL) {
    user.email = DEV_ADMIN_EMAIL;
    hasChanges = true;
  }

  if (user.username !== DEV_ADMIN_USERNAME) {
    user.username = DEV_ADMIN_USERNAME;
    hasChanges = true;
  }

  if (user.role !== 'admin') {
    user.role = 'admin';
    hasChanges = true;
  }

  const passwordMatches = user.password
    ? await bcrypt.compare(DEV_ADMIN_PASSWORD, user.password)
    : false;
  if (!passwordMatches) {
    hasChanges = true;
  }

  if (hasChanges) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          fullName: DEV_ADMIN_FULL_NAME,
          email: DEV_ADMIN_EMAIL,
          username: DEV_ADMIN_USERNAME,
          role: 'admin',
          password: passwordHash,
          updatedAt: new Date(),
        },
      },
    );
    console.log('[dev-auth] Local admin account refreshed for development.');
  }
}
