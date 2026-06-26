import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { roleHasPermission } from '../config/permissions.js';

function extractToken(req) {
  // 1. httpOnly cookie (preferred — not accessible from JS)
  if (req.cookies?.token) return req.cookies.token;
  // 2. Authorization header (backward compat for existing sessions + Postman/Swagger)
  if (req.headers.authorization?.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

/**
 * Protect route - verifies authentication using JWT from cookie or Authorization header.
 */
export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Not authorized, user not found' });
    }

    if (req.user.status !== 'active') {
      return res.status(403).json({ message: 'Акаунт деактивований' });
    }

    if (
      typeof decoded.tokenVersion === 'number' &&
      decoded.tokenVersion !== (req.user.tokenVersion ?? 0)
    ) {
      return res
        .status(401)
        .json({ message: 'Сесія завершена, увійдіть знову' });
    }

    return next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const optionalProtect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    // invalid token — continue as guest
  }
  next();
};

/**
 * Authorize roles - checks if the user has required permissions.
 * @param {string[]} roles - Allowed roles
 */
export const authorize = (...roles) => {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * Check if the user has specific permissions based on their role.
 * @param {string[]} permissions - Required permissions
 */
export const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const allowed = permissions
      .flat()
      .some((p) => roleHasPermission(req.user.role, p));
    if (!allowed) {
      return res.status(403).json({
        message: `Permission denied. Required: ${permissions.join(', ')}`,
      });
    }
    next();
  };
};
