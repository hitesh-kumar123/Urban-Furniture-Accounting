const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const config = require('../config/env');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');
const { ensureEmployeeForUser } = require('../services/employeeHelper');

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

    // Auto-link or generate employee profile with statutory leave quota
    const linkedEmp = await ensureEmployeeForUser(user);
    if (linkedEmp && (!user.employee || user.employee.toString() !== linkedEmp._id.toString())) {
      user.employee = linkedEmp._id;
    }

    const token = signToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;
    userObj.employee = linkedEmp || userObj.employee;

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

    // Ensure employee profile and statutory leave quota are ready
    const linkedEmp = await ensureEmployeeForUser(user);
    if (linkedEmp && (!user.employee || user.employee._id?.toString() !== linkedEmp._id.toString())) {
      user.employee = linkedEmp;
    }

    const token = signToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;
    userObj.employee = linkedEmp || userObj.employee;

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
    let user = await User.findById(req.user._id).populate('employee');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const linkedEmp = await ensureEmployeeForUser(user);
    if (linkedEmp && (!user.employee || user.employee._id?.toString() !== linkedEmp._id.toString())) {
      user.employee = linkedEmp;
    }

    return successResponse(res, {
      data: user,
      message: 'Current user profile'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all system users (Admin / HR)
 * GET /api/auth/users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('employee').sort({ createdAt: -1 });
    return successResponse(res, {
      data: users,
      message: 'System users list'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (Admin only)
 * PATCH /api/auth/users/:id/role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    return successResponse(res, {
      data: user,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getUsers,
  updateUserRole
};
