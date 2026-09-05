const { AppError } = require('./errorMiddleware');

/**
 * Role-Based Access Control (RBAC) middleware.
 * Usage: authorizeRoles('Admin', 'HR Payroll Manager', ...)
 * Admin always has unrestricted access.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User context not found.', 401));
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to perform this action. Required roles: ${roles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
