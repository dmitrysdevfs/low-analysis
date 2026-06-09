import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { getActiveCode } from '../services/admin/superCode.service.js';
import { sendTransactionalEmail } from '../modules/email/email.service.js';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function setCookieToken(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearCookieToken(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function detectRegistrationSource(referrer) {
  if (!referrer) return { referrer: null, source: 'direct' };
  if (/google\./i.test(referrer)) return { referrer, source: 'google' };
  if (/bing\./i.test(referrer)) return { referrer, source: 'bing' };
  if (/facebook\.|instagram\.|twitter\.|linkedin\.|tiktok\./i.test(referrer))
    return { referrer, source: 'social' };
  return { referrer, source: 'link' };
}

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { email, password, fullName, displayName, accountType, superCode } =
    req.body;

  const finalFullName = fullName || displayName;
  if (!finalFullName) {
    return res.status(400).json({ message: 'Please add a full name' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  let role = 'user';
  if (accountType === 'admin') {
    const activeCode = await getActiveCode();
    if (!superCode || superCode !== activeCode) {
      return res
        .status(400)
        .json({ message: 'Недійсний супер-код для реєстрації адміністратора' });
    }
    role = 'admin';
  }

  const rawReferrer =
    req.body.registrationReferrer || req.headers.referer || null;
  const registrationSource = detectRegistrationSource(rawReferrer);

  const user = await User.create({
    email,
    password,
    fullName: finalFullName,
    role,
    registrationSource,
  });

  if (user) {
    const token = generateToken(user._id);
    setCookieToken(res, token);
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      // token still returned in body for backward compat with existing clients
      token,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Please provide email or username and password' });
  }

  const identifier = email.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  if (user && (await user.comparePassword(password))) {
    const token = generateToken(user._id);
    setCookieToken(res, token);
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      // token still returned in body for backward compat
      token,
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { displayName, fullName } = req.body;
    const finalFullName = fullName || displayName;

    if (finalFullName) {
      user.fullName = finalFullName.trim();
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * @desc    Update user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const updateUserPassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (user) {
    const { currentPassword, nextPassword } = req.body;

    if (!currentPassword || !nextPassword) {
      return res
        .status(400)
        .json({ message: 'Please provide current and next password' });
    }

    const minLength =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? 3
        : 8;
    if (nextPassword.length < minLength) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${minLength} characters` });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = nextPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * @desc    Logout user — clears httpOnly cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  clearCookieToken(res);
  res.json({ message: 'Logged out successfully' });
};

/**
 * @desc    Request password reset — sends email with token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide email' });
  }

  // Always respond 200 to avoid confirming email existence
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+resetPasswordToken +resetPasswordExpiry',
  );
  if (!user) {
    return res.json({
      message: 'If this email exists, a reset link was sent.',
    });
  }

  // Generate token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const frontendUrl =
    process.env.FRONTEND_URL || 'https://low-analysis-frontend.vercel.app';
  const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><title>Відновлення паролю</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,Arial,sans-serif;color:#e8e6df;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border-bottom:1px solid #1e2d4a;padding-bottom:20px;margin-bottom:28px;">
      <span style="font-size:18px;font-weight:700;color:#c9a96e;letter-spacing:.04em;">Law Analysis</span>
    </div>
    <div style="background:#12192e;border:1px solid #1e2d4a;border-radius:8px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#e8e6df;">Відновлення паролю</h1>
      <p style="color:#8892a4;line-height:1.7;margin:0 0 24px;">Ви запросили скидання паролю для вашого акаунту Law Analysis. Натисніть кнопку нижче, щоб встановити новий пароль.</p>
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#c9a96e;color:#0a0f1e;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:700;font-size:14px;">Встановити новий пароль</a>
      </p>
      <p style="color:#8892a4;font-size:12px;line-height:1.6;margin:0;">Посилання дійсне 1 годину. Якщо ви не запитували скидання паролю — просто ігноруйте цей лист.</p>
    </div>
    <div style="margin-top:24px;text-align:center;font-size:11px;color:#8892a4;">
      © ${new Date().getFullYear()} Law Analysis. Всі права захищені.
    </div>
  </div>
</body>
</html>`;

  try {
    await sendTransactionalEmail({
      to: [{ email: user.email, name: user.fullName }],
      subject: 'Відновлення паролю — Law Analysis',
      htmlContent,
    });
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(500)
      .json({ message: 'Email could not be sent. Please try again.' });
  }

  res.json({ message: 'If this email exists, a reset link was sent.' });
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res
      .status(400)
      .json({ message: 'Token and new password are required' });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 8 characters' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpiry');

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.json({ message: 'Password reset successfully' });
};
