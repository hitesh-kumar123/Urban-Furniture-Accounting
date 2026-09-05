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
      if (req.body.isManualCorrection === true || (req.body.workedHours !== undefined && !req.body.checkIn)) {
        return next(new AppError('Forbidden: Manual attendance creation is restricted to HR and Admin roles', 403));
      }
      const emp = await ensureEmployeeForUser(req.user);
      targetEmployee = emp ? emp._id : (req.user.employee?._id || req.user.employee);
      if (!targetEmployee) {
        return next(new AppError('No employee profile linked to this user account', 400));
      }
    }

    if (!targetEmployee) {
      return next(new AppError('Employee ID is required', 400));
    }

    const date = req.body.date ? new Date(req.body.date) : new Date();
    date.setUTCHours(0, 0, 0, 0);

    const now = req.body.checkIn ? new Date(req.body.checkIn) : new Date();

    const existing = await Attendance.findOne({ employee: targetEmployee, date });
    if (existing) {
      if (!isHrOrAdmin || req.body.appendPunch) {
        // Multi-Punch / Break Return: Re-open session or append new punch interval seamlessly
        if (!Array.isArray(existing.punches)) {
          existing.punches = [];
        }

        // Migrate legacy single punch if needed
        if (existing.punches.length === 0 && existing.checkIn) {
          existing.punches.push({
            in: existing.checkIn,
            out: existing.checkOut || null,
            durationHours: existing.workedHours || 0,
            type: 'Regular'
          });
        }

        const lastPunch = existing.punches[existing.punches.length - 1];
        if (!lastPunch || lastPunch.out) {
          // Add new active punch session
          existing.punches.push({
            in: now,
            out: null,
            durationHours: 0,
            type: req.body.type || 'Regular'
          });
        }

        existing.checkOut = null;
        if (!existing.checkIn) {
          existing.checkIn = now;
        }
        existing.status = 'Present';

        await existing.save();

        return successResponse(res, {
          status: 200,
          message: 'Clocked in successfully (New punch session started)',
          data: existing
        });
      }
      return next(new AppError('Attendance record for this employee on this date already exists. Use update instead.', 409));
    }

    const attendance = new Attendance({
      ...req.body,
      employee: targetEmployee,
      date,
      checkIn: now,
      checkOut: null,
      punches: [
        {
          in: now,
          out: null,
          durationHours: 0,
          type: req.body.type || 'Regular'
        }
      ],
      isManualCorrection: isHrOrAdmin ? !!req.body.isManualCorrection : false
    });

    await attendance.save();

    return successResponse(res, {
      status: 201,
      message: 'Attendance created and clocked in successfully',
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

    // Employees can clock out their own record
    if (!isHrOrAdmin) {
      const emp = await ensureEmployeeForUser(req.user);
      const userEmpId = (emp?._id || req.user.employee?._id || req.user.employee || '').toString();
      const recordEmpId = (record.employee?._id || record.employee || '').toString();

      if (recordEmpId !== userEmpId) {
        return next(new AppError('Forbidden: You can only update your own attendance', 403));
      }

      // If employee is attempting manual correction (forced manual flag or forced workedHours override)
      if (req.body.isManualCorrection === true) {
        return next(new AppError('Forbidden: Attendance manual adjustments are restricted to HR and Admin roles', 403));
      }

      // Employee standard clock-out / session close
      if (req.body.checkOut !== undefined) {
        const outTime = req.body.checkOut ? new Date(req.body.checkOut) : new Date();
        record.checkOut = outTime;

        if (!Array.isArray(record.punches)) {
          record.punches = [];
        }

        const openPunch = record.punches.slice().reverse().find((p) => !p.out);
        if (openPunch) {
          openPunch.out = outTime;
        } else if (record.checkIn) {
          record.punches.push({
            in: record.checkIn,
            out: outTime,
            type: 'Regular'
          });
        }
      }
      if (req.body.status) {
        record.status = req.body.status;
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
 * Toggle Shift Punch (Clock In / Clock Out / Break / Return) seamlessly
 * POST /api/attendance/punch
 */
const togglePunch = async (req, res, next) => {
  try {
    const emp = await ensureEmployeeForUser(req.user);
    const targetEmployee = emp ? emp._id : (req.user.employee?._id || req.user.employee);
    if (!targetEmployee) {
      return next(new AppError('No employee profile linked to current user account', 400));
    }

    const now = new Date();
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);

    let record = await Attendance.findOne({ employee: targetEmployee, date });

    if (!record) {
      // 1st Punch of the Day -> Clock In
      record = new Attendance({
        employee: targetEmployee,
        date,
        checkIn: now,
        checkOut: null,
        punches: [
          {
            in: now,
            out: null,
            durationHours: 0,
            type: req.body.type || 'Regular'
          }
        ],
        status: 'Present'
      });
      await record.save();

      return successResponse(res, {
        status: 201,
        message: 'Clocked in successfully. Have a productive shift!',
        data: { record, action: 'clocked_in' }
      });
    }

    // Existing Day Record: Check if currently clocked in (active open punch)
    if (!Array.isArray(record.punches)) {
      record.punches = [];
    }

    // Migrate legacy record if punches array was empty
    if (record.punches.length === 0 && record.checkIn) {
      record.punches.push({
        in: record.checkIn,
        out: record.checkOut || null,
        durationHours: record.workedHours || 0,
        type: 'Regular'
      });
    }

    const openPunch = record.punches.slice().reverse().find((p) => !p.out);

    if (openPunch || !record.checkOut) {
      // Currently Clocked In -> Clock Out (Take break / lunch / step out / logout)
      if (openPunch) {
        openPunch.out = now;
      } else if (record.checkIn) {
        record.punches.push({ in: record.checkIn, out: now, type: 'Regular' });
      }
      record.checkOut = now;
      await record.save();

      return successResponse(res, {
        status: 200,
        message: 'Clocked out / Break logged. Shift paused.',
        data: { record, action: 'clocked_out' }
      });
    } else {
      // Currently Clocked Out -> Clock In Again (Resume from break / lunch)
      record.punches.push({
        in: now,
        out: null,
        durationHours: 0,
        type: req.body.type || 'Regular'
      });
      record.checkOut = null;
      record.status = 'Present';
      await record.save();

      return successResponse(res, {
        status: 200,
        message: 'Resumed shift / Clocked in successfully. Welcome back!',
        data: { record, action: 'clocked_in' }
      });
    }
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
  togglePunch,
  deleteAttendance
};
