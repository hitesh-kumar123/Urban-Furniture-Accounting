const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all employees with filtering, searching, and pagination
 * GET /api/employees
 */
const getEmployees = async (req, res, next) => {
  try {
    const { department, employeeStatus, employeeType, search, page = 1, limit = 50 } = req.query;

    // If role is Employee, only return self
    if (req.user.role === 'Employee') {
      if (!req.user.employee) {
        return successResponse(res, { data: [], message: 'No employee record linked' });
      }
      const selfEmp = await Employee.findById(req.user.employee)
        .populate('manager', 'firstName lastName email')
        .populate('workingSchedule');
      return successResponse(res, { data: [selfEmp], message: 'Self employee record' });
    }

    const query = {};
    if (department) query.department = department;
    if (employeeStatus) query.employeeStatus = employeeStatus;
    if (employeeType) query.employeeType = employeeType;
    if (search) {
      const cleanSearch = String(search).trim();
      const terms = cleanSearch.split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        query.$and = terms.map((term) => {
          const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return {
            $or: [
              { firstName: { $regex: safeTerm, $options: 'i' } },
              { lastName: { $regex: safeTerm, $options: 'i' } },
              { email: { $regex: safeTerm, $options: 'i' } },
              { employeeId: { $regex: safeTerm, $options: 'i' } },
              { jobPosition: { $regex: safeTerm, $options: 'i' } },
              { department: { $regex: safeTerm, $options: 'i' } }
            ]
          };
        });
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('manager', 'firstName lastName email employeeId')
        .populate('workingSchedule')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Employee.countDocuments(query)
    ]);

    return successResponse(res, {
      data: employees,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get employee by ID
 * GET /api/employees/:id
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // RBAC check: Employee role can only view self
    if (req.user.role === 'Employee' && req.user.employee?.toString() !== id) {
      return next(new AppError('Forbidden: You can only access your own employee profile', 403));
    }

    const employee = await Employee.findById(id)
      .populate('manager', 'firstName lastName email employeeId')
      .populate('workingSchedule')
      .populate('user', 'email role status');

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Also fetch current active contract summary if available
    const activeContract = await Contract.findOne({
      employee: id,
      status: 'Active'
    }).populate('salaryStructure');

    return successResponse(res, {
      data: {
        ...employee.toObject(),
        activeContract
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new employee
 * POST /api/employees
 */
const createEmployee = async (req, res, next) => {
  try {
    const existing = await Employee.findOne({
      $or: [{ email: req.body.email.toLowerCase() }, { employeeId: req.body.employeeId.toUpperCase() }]
    });

    if (existing) {
      return next(new AppError('Employee with this email or Employee ID already exists', 409));
    }

    const employee = await Employee.create({
      ...req.body,
      email: req.body.email.toLowerCase(),
      employeeId: req.body.employeeId.toUpperCase()
    });

    return successResponse(res, {
      status: 201,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update employee
 * PUT /api/employees/:id
 */
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).populate('manager').populate('workingSchedule');

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    return successResponse(res, {
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete employee
 * DELETE /api/employees/:id
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    return successResponse(res, {
      message: 'Employee deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
