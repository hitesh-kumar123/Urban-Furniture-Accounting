const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const config = require('../config/env');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, employee } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 409));
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'Employee',
      employee: employee || null
    });

    // If linked to an employee, update employee's user ref
    if (employee) {
      await Employee.findByIdAndUpdate(employee, { user: user._id });
    }

    const token = signToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return successResponse(res, {
      status: 201,
      message: 'User registered successfully',
      data: {
        user: userObj,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate('employee');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.status !== 'Active') {
      return next(new AppError('Your account has been deactivated. Please contact HR.', 403));
    }

    const token = signToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return successResponse(res, {
      message: 'Login successful',
      data: {
        user: userObj,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('employee');
    return successResponse(res, {
      data: user,
      message: 'Current user profile'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
