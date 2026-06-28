import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { getClientIp } from '../utils/getClientIp.js';
import { getActiveCode } from '../services/admin/superCode.service.js';
import { appendAuditEntry } from '../services/admin/audit.service.js';
import { sendTransactionalEmail } from '../modules/email/email.service.js';
import { renderEmailTemplate } from '../modules/email/email.renderer.js';
import EmailLog from '../models/EmailLog.js';

function getFrontendUrl() {
  const url = process.env.FRONTEND_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error(
      'FRONTEND_URL environment variable is required in production',
    );
  }
  return url || 'http://localhost:3001';
}

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

function parseDevice(userAgent) {
  if (!userAgent) return null;
  const os = /Mac OS X/.test(userAgent)
    ? 'macOS'
    : /Windows NT/.test(userAgent)
      ? 'Windows'
      : /Linux/.test(userAgent)
        ? 'Linux'
        : /Android/.test(userAgent)
          ? 'Android'
          : /iPhone|iPad/.test(userAgent)
            ? 'iOS'
            : null;
  const chromeVer = /Chrome\/(\d+)/.exec(userAgent);
  const firefoxVer = /Firefox\/(\d+)/.exec(userAgent);
  const browser = chromeVer
    ? `Chrome ${chromeVer[1]}`
    : firefoxVer
      ? `Firefox ${firefoxVer[1]}`
      : /Safari\//.test(userAgent)
        ? 'Safari'
        : null;
  return [browser, os].filter(Boolean).join(' / ') || null;
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
      appendAuditEntry({
        action: 'Спроба підключення з невалідним кодом',
        detail: `Спроба реєстрації адміністратора з невалідним супер-кодом. Email: ${email}.`,
        actor: email || 'Невідомо',
        severity: 'security',
        ipAddress: getClientIp(req),
      }).catch(() => {});
      return res
        .status(400)
        .json({ message: 'Недійсний супер-код для реєстрації адміністратора' });
    }
    role = 'admin';
  }

  const rawReferrer =
    req.body.registrationReferrer || req.headers.referer || null;
  const registrationSource = detectRegistrationSource(rawReferrer);

  const skipVerification =
    process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'false';

  const user = await User.create({
    email,
    password,
    fullName: finalFullName,
    role,
    registrationSource,
    ...(skipVerification ? { isVerified: true } : {}),
  });

  if (user) {
    if (role === 'admin') {
      appendAuditEntry({
        action: 'Успішне підключення адміністратора',
        detail: `Новий адмін-акаунт зареєстровано: ${email}.`,
        actor: email,
        severity: 'security',
        ipAddress: getClientIp(req),
      }).catch(() => {});
    }

    if (skipVerification) {
      appendAuditEntry({
        action: 'Demo: реєстрація без підтвердження email',
        detail: `Акаунт зареєстровано без email-верифікації (AUTH_REQUIRE_EMAIL_VERIFICATION=false). Email: ${email}.`,
        actor: email,
        severity: 'info',
        ipAddress: getClientIp(req),
      }).catch(() => {});
      return res.status(201).json({
        message: 'Акаунт створено. Можна увійти одразу.',
        requiresEmailVerification: false,
        emailSent: false,
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    user.verificationToken = hashedToken;
    user.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${getFrontendUrl()}/auth/verify-email?token=${rawToken}`;
    const htmlContent = renderEmailTemplate({
      templateSlug: 'verify-email',
      subject: 'Підтвердіть email — Low Analysis',
      props: { fullName: user.fullName, verifyUrl },
    });
    let emailSent = false;
    try {
      const emailResult = await sendTransactionalEmail({
        to: [{ email: user.email, name: user.fullName }],
        subject: 'Підтвердіть email — Low Analysis',
        htmlContent,
      });
      emailSent = true;
      await EmailLog.create({
        recipientEmail: user.email,
        status: 'sent',
        brevoMessageId: emailResult?.messageId || emailResult?.data?.messageId,
      }).catch((logErr) => {
        console.error('Failed to log successful email send:', logErr.message);
      });
    } catch (err) {
      console.error('Failed to send verification email:', err.message);
      appendAuditEntry({
        action: 'Email верифікації не надіслано',
        detail: `Помилка відправки для ${user.email}: ${err.message}`,
        actor: user.email,
        severity: 'error',
      }).catch(() => {});
      await EmailLog.create({
        recipientEmail: user.email,
        status: 'failed',
        error: err.message,
      }).catch((logErr) => {
        console.error('Failed to log failed email send:', logErr.message);
      });
    }

    res.status(201).json({
      message: emailSent
        ? 'Перевірте email для підтвердження акаунта'
        : 'Акаунт створено, але лист не вдалося надіслати. Спробуйте "Надіслати повторно" після входу.',
      requiresEmailVerification: true,
      emailSent,
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
    const isTestAccount =
      user.role === 'admin' ||
      user.email.endsWith('@lowanalysis.com') ||
      user.email.endsWith('@low-analysis.dev') ||
      (user.email.startsWith('test') && user.email.endsWith('@gmail.com')) ||
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test';

    if (
      user.isVerified === false &&
      !isTestAccount &&
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== 'false'
    ) {
      return res.status(403).json({
        message: 'Підтвердіть email перед входом',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const token = generateToken(user._id, user.tokenVersion ?? 0);
    setCookieToken(res, token);
    User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      lastLoginIp: getClientIp(req),
      lastLoginDevice: parseDevice(req.headers['user-agent']),
    }).catch(() => {});
    res.json({
      _id: user._id,
      fullName: user.fullName,
      displayName: user.fullName,
      email: user.email,
      role: user.role,
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
      displayName: user.fullName,
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
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    const newToken = generateToken(user._id, user.tokenVersion);
    setCookieToken(res, newToken);

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
export const logoutUser = async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) {
        await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
      }
    } catch {
      // token already invalid — nothing to revoke
    }
  }
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

  const resetUrl = `${getFrontendUrl()}/auth/reset-password?token=${rawToken}`;

  const htmlContent = renderEmailTemplate({
    templateSlug: 'password-reset',
    subject: 'Відновлення паролю — Law Analysis',
    props: { resetUrl },
  });

  try {
    await sendTransactionalEmail({
      to: [{ email: user.email, name: user.fullName }],
      subject: 'Відновлення паролю — Law Analysis',
      htmlContent,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });
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

/**
 * @desc    Verify email with token
 * @route   GET /api/auth/verify-email?token=
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpiry: { $gt: new Date() },
  }).select('+verificationToken +verificationExpiry');

  if (!user) {
    return res
      .status(400)
      .json({ message: 'Недійсне або протерміноване посилання' });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  const jwtToken = generateToken(user._id, user.tokenVersion ?? 0);
  setCookieToken(res, jwtToken);

  res.json({
    _id: user._id,
    fullName: user.fullName,
    displayName: user.fullName,
    email: user.email,
    role: user.role,
    message: 'Email підтверджено',
  });
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }

  const GENERIC = {
    message: 'Якщо акаунт існує і не підтверджений, листа надіслано',
  };

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+verificationToken +verificationExpiry',
  );

  if (!user || user.isVerified) {
    return res.json(GENERIC);
  }

  const COOLDOWN_MS = 60 * 1000;
  const tokenAge = user.verificationExpiry
    ? 24 * 60 * 60 * 1000 - (user.verificationExpiry.getTime() - Date.now())
    : Infinity;
  if (tokenAge < COOLDOWN_MS) {
    return res
      .status(429)
      .json({ message: 'Зачекайте перед повторною відправкою' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  user.verificationToken = hashedToken;
  user.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${getFrontendUrl()}/auth/verify-email?token=${rawToken}`;
  const htmlContent = renderEmailTemplate({
    templateSlug: 'verify-email',
    subject: 'Підтвердіть email — Low Analysis',
    props: { fullName: user.fullName, verifyUrl },
  });

  let emailSent = false;
  try {
    const emailResult = await sendTransactionalEmail({
      to: [{ email: user.email, name: user.fullName }],
      subject: 'Підтвердіть email — Low Analysis',
      htmlContent,
    });
    emailSent = true;
    await EmailLog.create({
      recipientEmail: user.email,
      status: 'sent',
      brevoMessageId: emailResult?.messageId || emailResult?.data?.messageId,
    }).catch((logErr) => {
      console.error('Failed to log successful verification email send:', logErr.message);
    });
  } catch (err) {
    console.error('Failed to resend verification email:', err.message);
    appendAuditEntry({
      action: 'Повторний email верифікації не надіслано',
      detail: `Помилка відправки для ${user.email}: ${err.message}`,
      actor: user.email,
      severity: 'error',
    }).catch(() => {});
    await EmailLog.create({
      recipientEmail: user.email,
      status: 'failed',
      error: err.message,
    }).catch((logErr) => {
      console.error('Failed to log failed verification email send:', logErr.message);
    });
  }

  res.json({ ...GENERIC, emailSent });
};

export const googleAuth = async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken)
    return res.status(400).json({ message: 'Access token required' });

  try {
    const googleRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!googleRes.ok)
      return res.status(401).json({ message: 'Невалідний Google токен' });

    const { sub: googleId, email, name } = await googleRes.json();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
        appendAuditEntry({
          action: "Google акаунт прив'язано до існуючого профілю",
          detail: `Google ID зв'язаний з існуючим акаунтом. Email: ${email}.`,
          actor: email,
          severity: 'info',
          ipAddress: getClientIp(req),
        }).catch(() => {});
      }
    } else {
      user = await User.create({
        googleId,
        email,
        fullName: name || email.split('@')[0],
        role: 'user',
        isVerified: true,
        registrationSource: { source: 'google' },
      });
      isNewUser = true;
    }

    const token = generateToken(user._id, user.tokenVersion ?? 0);
    setCookieToken(res, token);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isNewUser,
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ message: 'Помилка Google авторизації' });
  }
};
