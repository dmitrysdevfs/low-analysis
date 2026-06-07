import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

export async function optionalSupportAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    req.user = null;
  }

  next();
}
