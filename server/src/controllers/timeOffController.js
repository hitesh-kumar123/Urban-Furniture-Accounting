const TimeOffType = require('../models/TimeOffType');
const LeaveAllocation = require('../models/LeaveAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const { approveLeaveRequest, refuseLeaveRequest, getLeaveBalance } = require('../services/leaveService');
const { ensureEmployeeForUser } = require('../services/employeeHelper');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

// ==================== TIME OFF TYPES ====================

const getTimeOffTypes = async (req, res, next) => {
  try {
    const query = req.user.role === 'Employee' ? { status: 'Active' } : {};
    const types = await TimeOffType.find(query).sort({ name: 1 });
    return successResponse(res, { data: types });
  } catch (error) {
    next(error);
  }
};

const createTimeOffType = async (req, res, next) => {
  try {
    const existing = await TimeOffType.findOne({
      $or: [{ name: req.body.name }, { code: req.body.code.toUpperCase() }]
    });
    if (existing) {
      return next(new AppError('Time off type with this name or code already exists', 409));
    }

    const type = await TimeOffType.create({
      ...req.body,
      code: req.body.code.toUpperCase()
    });

    return successResponse(res, {
      status: 201,
      message: 'Time off type created successfully',
      data: type
    });
  } catch (error) {
    next(error);
  }
};

const updateTimeOffType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const type = await TimeOffType.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!type) {
      return next(new AppError('Time off type not found', 404));
    }
    return successResponse(res, { data: type, message: 'Time off type updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteTimeOffType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const type = await TimeOffType.findByIdAndDelete(id);
    if (!type) {
      return next(new AppError('Time off type not found', 404));
    }
    return successResponse(res, { data: { id }, message: 'Time off type deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== LEAVE ALLOCATIONS ====================

const getLeaveAllocations = async (req, res, next) => {
  try {
    const { employee, timeOffType, status } = req.query;
    const query = {};

    if (req.user.role === 'Employee') {
      const emp = await ensureEmployeeForUser(req.user);
      query.employee = emp ? emp._id : req.user.employee;
    } else if (employee) {
      query.employee = employee;
    }

    if (timeOffType) query.timeOffType = timeOffType;
    if (status) query.status = status;

    const allocations = await LeaveAllocation.find(query)
      .populate('employee', 'firstName lastName email employeeId department')
      .populate('timeOffType', 'name code unit')
      .sort({ createdAt: -1 });

    return successResponse(res, { data: allocations });
  } catch (error) {
    next(error);
  }
};

const createLeaveAllocation = async (req, res, next) => {
  try {
    const allocation = new LeaveAllocation(req.body);
    await allocation.save();

    const populated = await LeaveAllocation.findById(allocation._id)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('timeOffType', 'name code unit');

    return successResponse(res, {
      status: 201,
      message: 'Leave allocation created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

const updateLeaveAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await LeaveAllocation.findById(id);
    if (!allocation) {
      return next(new AppError('Leave allocation not found', 404));
    }

    Object.assign(allocation, req.body);
    await allocation.save();

    return successResponse(res, { data: allocation, message: 'Leave allocation updated' });
  } catch (error) {
    next(error);
  }
};

const approveLeaveAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await LeaveAllocation.findById(id);
    if (!allocation) {
      return next(new AppError('Leave allocation not found', 404));
    }

    allocation.status = 'Approved';
    await allocation.save();

    return successResponse(res, { data: allocation, message: 'Leave allocation approved' });
  } catch (error) {
    next(error);
  }
};

// ==================== TIME OFF REQUESTS ====================

const getTimeOffRequests = async (req, res, next) => {
  try {
    const { employee, status, timeOffType, startDate, endDate } = req.query;
    const query = {};

    if (req.user.role === 'Employee') {
      const emp = await ensureEmployeeForUser(req.user);
      query.employee = emp ? emp._id : req.user.employee;
    } else if (employee) {
      query.employee = employee;
    }

    if (status) query.status = status;
    if (timeOffType) query.timeOffType = timeOffType;
    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate) };
      query.endDate = { $gte: new Date(startDate) };
    }

    const requests = await TimeOffRequest.find(query)
      .populate('employee', 'firstName lastName email employeeId department')
      .populate('timeOffType', 'name code unit isPaid allocationRequired')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, { data: requests });
  } catch (error) {
    next(error);
  }
};

const getTimeOffRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await TimeOffRequest.findById(id)
      .populate('employee')
      .populate('timeOffType')
      .populate('approvedBy', 'name email');

    if (!request) {
      return next(new AppError('Time off request not found', 404));
    }

    if (req.user.role === 'Employee') {
      const userEmpId = req.user.employee?._id?.toString() || req.user.employee?.toString();
      if (request.employee._id.toString() !== userEmpId) {
        return next(new AppError('Forbidden: You can only view your own leave requests', 403));
      }
    }

    return successResponse(res, { data: request });
  } catch (error) {
    next(error);
  }
};

const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;

  // Use UTC year, month, date to be 100% timezone agnostic
  const cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const last = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));
  if (cur > last) return 0;

  let workingDays = 0;
  while (cur <= last) {
    const day = cur.getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return workingDays;
};

const createTimeOffRequest = async (req, res, next) => {
  try {
    let targetEmployee = req.body.employee;

    if (req.user.role === 'Employee') {
      const emp = await ensureEmployeeForUser(req.user);
      targetEmployee = emp ? emp._id : req.user.employee;
      if (!targetEmployee) {
        return next(new AppError('No linked employee profile found', 400));
      }
    }

    // Auto-compute duration excluding weekends (Saturday & Sunday)
    const workingDays = calculateWorkingDays(req.body.startDate, req.body.endDate);
    if (workingDays === 0 && req.body.startDate && req.body.endDate) {
      return next(
        new AppError(
          'Selected date range falls entirely on weekends (Saturday/Sunday). Leave is not required for non-working days.',
          400
        )
      );
    }

    let duration = req.body.duration !== undefined && Number(req.body.duration) > 0 && Number(req.body.duration) <= workingDays
      ? Number(req.body.duration)
      : workingDays;

    // Check time off type
    const timeOffType = await TimeOffType.findById(req.body.timeOffType);
    if (!timeOffType || timeOffType.status !== 'Active') {
      return next(new AppError('Invalid or inactive time off type', 400));
    }

    // Check balance upfront if allocation is required
    if (timeOffType.allocationRequired) {
      const balance = await getLeaveBalance(targetEmployee, timeOffType._id, req.body.startDate);
      if (balance.remaining < duration) {
        return next(
          new AppError(
            `Insufficient leave balance. Requested: ${duration} ${timeOffType.unit}, Remaining: ${balance.remaining} ${timeOffType.unit}`,
            400
          )
        );
      }
    }

    const request = await TimeOffRequest.create({
      ...req.body,
      duration,
      employee: targetEmployee,
      status: timeOffType.approvalRequired ? 'Pending' : 'Approved'
    });

    const populated = await TimeOffRequest.findById(request._id)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('timeOffType', 'name code unit');

    return successResponse(res, {
      status: 201,
      message: 'Time off request submitted successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

const updateTimeOffRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await TimeOffRequest.findById(id);
    if (!request) {
      return next(new AppError('Time off request not found', 404));
    }

    if (request.status !== 'Draft' && request.status !== 'Pending') {
      return next(new AppError(`Cannot update a request with status '${request.status}'`, 400));
    }

    Object.assign(request, req.body);
    await request.save();

    return successResponse(res, { data: request, message: 'Time off request updated successfully' });
  } catch (error) {
    next(error);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approved = await approveLeaveRequest(id, req.user._id);

    return successResponse(res, {
      message: 'Time off request approved and leave allocation updated',
      data: approved
    });
  } catch (error) {
    next(error);
  }
};

const refuseRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const refused = await refuseLeaveRequest(id, req.user._id, rejectionReason);

    return successResponse(res, {
      message: 'Time off request refused',
      data: refused
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeLeaveBalance = async (req, res, next) => {
  try {
    let employeeId = req.query.employeeId || req.user.employee?._id || req.user.employee;

    if (req.user.role === 'Employee') {
      const emp = await ensureEmployeeForUser(req.user);
      employeeId = emp ? emp._id : employeeId;
    }

    if (!employeeId) {
      return next(new AppError('Employee ID required', 400));
    }

    if (req.user.role === 'Employee') {
      const userEmpId = req.user.employee?._id?.toString() || req.user.employee?.toString();
      if (userEmpId && userEmpId !== employeeId.toString()) {
        return next(new AppError('Forbidden: Access denied to other employee balances', 403));
      }
    }

    const { timeOffTypeId } = req.query;

    if (timeOffTypeId) {
      const balance = await getLeaveBalance(employeeId, timeOffTypeId);
      return successResponse(res, { data: balance });
    }

    // Get balances across all active time off types
    const types = await TimeOffType.find({ status: 'Active' });
    const balances = await Promise.all(
      types.map(async (t) => {
        const bal = await getLeaveBalance(employeeId, t._id);
        return {
          timeOffType: t,
          ...bal
        };
      })
    );

    return successResponse(res, { data: balances });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  getLeaveAllocations,
  createLeaveAllocation,
  updateLeaveAllocation,
  approveLeaveAllocation,
  getTimeOffRequests,
  getTimeOffRequestById,
  createTimeOffRequest,
  updateTimeOffRequest,
  approveRequest,
  refuseRequest,
  getEmployeeLeaveBalance
};
