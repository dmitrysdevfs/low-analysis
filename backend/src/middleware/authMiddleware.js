import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect route - verifies authentication using JWT.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res
          .status(401)
          .json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch {
      // Token invalid or expired — return immediately to avoid double-response
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // No token provided at all
  return res.status(401).json({ message: 'Not authorized, no token' });
};

/**
 * Authorize roles - checks if the user has required permissions.
 * @param {string[]} roles - Allowed roles
 */
export const authorize = (...roles) => {
  // Flatten in case called as authorize(['admin']) instead of authorize('admin')
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
