const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');
const { ensureEmployeeForUser } = require('../services/employeeHelper');

/**
 * Get attendance records with filtering
 * GET /api/attendance
 */
const getAttendance = async (req, res, next) => {
  try {
    const { employee, department, startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const query = {};

    // RBAC: Employee role can only view own attendance
    if (req.user.role === 'Employee') {
      const emp = await ensureEmployeeForUser(req.user);
      query.employee = emp ? emp._id : req.user.employee;
    } else if (employee) {
      query.employee = employee;
    }

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    if (status) {
      query.status = status;
    }

    if (department && req.user.role !== 'Employee') {
      const deptEmployees = await Employee.find({ department }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id);
      if (query.employee) {
        // If employee was also specified, keep if in dept
      } else {
        query.employee = { $in: deptEmpIds };
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('employee', 'firstName lastName email employeeId department')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Attendance.countDocuments(query)
    ]);

    return successResponse(res, {
      data: records,
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
 * Get attendance record by ID
 * GET /api/attendance/:id
 */
const getAttendanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findById(id).populate('employee');

    if (!record) {
      return next(new AppError('Attendance record not found', 404));
    }

    if (req.user.role === 'Employee' && record.employee._id.toString() !== req.user.employee?.toString()) {
      return next(new AppError('Forbidden: Access denied to other employee attendance records', 403));
    }

    return successResponse(res, {
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create attendance entry (or check-in)
 * POST /api/attendance
 */
const createAttendance = async (req, res, next) => {
  try {
    let targetEmployee = req.body.employee;
    const hrRoles = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'];
    const isHrOrAdmin = hrRoles.includes(req.user.role);

    // If logged in as employee, force self employee id and prevent manual creation overrides
    if (!isHrOrAdmin) {
      if (req.body.isManualCorrection) {
        return next(new AppError('Forbidden: Manual attendance creation is restricted to HR and Admin roles', 403));
      }
      const emp = await ensureEmployeeForUser(req.user);
      targetEmployee = emp ? emp._id : req.user.employee;
      if (!targetEmployee) {
        return next(new AppError('No employee profile linked to this user account', 400));
      }
    }

    if (!targetEmployee) {
      return next(new AppError('Employee ID is required', 400));
    }

    const date = req.body.date ? new Date(req.body.date) : new Date();
    date.setUTCHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ employee: targetEmployee, date });
    if (existing) {
      return next(new AppError('Attendance record for this employee on this date already exists. Use update instead.', 409));
    }

    const attendance = new Attendance({
      ...req.body,
      employee: targetEmployee,
      date,
      isManualCorrection: isHrOrAdmin ? !!req.body.isManualCorrection : false
    });

    await attendance.save();

    return successResponse(res, {
      status: 201,
      message: 'Attendance created successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update attendance record (or clock out / manual correction)
 * PUT /api/attendance/:id
 */
const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await Attendance.findById(id);
    if (!record) {
      return next(new AppError('Attendance record not found', 404));
    }

    const hrRoles = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'];
    const isHrOrAdmin = hrRoles.includes(req.user.role);

    // Employees can only clock out their own record if checkOut is missing
    if (!isHrOrAdmin) {
      if (record.employee.toString() !== req.user.employee?.toString()) {
        return next(new AppError('Forbidden: You can only update your own attendance', 403));
      }

      // If employee is attempting manual correction or field alterations
      if (
        req.body.isManualCorrection !== undefined ||
        req.body.status ||
        req.body.workedHours !== undefined ||
        req.body.date ||
        req.body.checkIn ||
        req.body.remarks
      ) {
        return next(new AppError('Forbidden: Attendance correction and manual adjustments are restricted to HR and Admin roles', 403));
      }

      // Employee standard clock-out
      if (req.body.checkOut) {
        record.checkOut = new Date(req.body.checkOut);
        record.status = 'Present';
      }
    } else {
      // HR/Admin manual update
      Object.assign(record, req.body);
      if (req.body.isManualCorrection === undefined) {
        record.isManualCorrection = true;
      }
    }

    await record.save();

    return successResponse(res, {
      message: 'Attendance record updated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete attendance record
 * DELETE /api/attendance/:id
 */
const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await Attendance.findByIdAndDelete(id);
    if (!record) {
      return next(new AppError('Attendance record not found', 404));
    }

    return successResponse(res, {
      message: 'Attendance record deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
};
