const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { AppError } = require('./errorMiddleware');

/**
 * Authenticates user from Bearer JWT token in Authorization header.
 * Attaches req.user (and loads employee ref if populated).
 */
const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (user.status !== 'Active') {
      return next(new AppError('User account is inactive or suspended.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateUser
};
