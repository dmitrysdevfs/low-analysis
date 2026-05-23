/**
 * Authentication and authorization middlewares (Mock implementation for MVP).
 * In production, these should verify JWT tokens and check user roles from the database.
 */

/**
 * Protect route - verifies authentication.
 * Attaches a mock admin user to the request object.
 */
export const protect = (req, res, next) => {
  // In a real application, check Authorization header, verify JWT, etc.
  req.user = {
    id: 'mock-admin-id',
    role: 'admin', // Default to admin for MVP local environment compatibility
  };
  next();
};

/**
 * Authorize roles - checks if the user has required permissions.
 * @param {string[]} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
