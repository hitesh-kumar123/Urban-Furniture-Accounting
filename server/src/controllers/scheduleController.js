const { WorkingSchedule } = require('../models/WorkingSchedule');
const { calculateWeeklyHours } = require('../services/scheduleService');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all working schedules
 * GET /api/schedules
 */
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await WorkingSchedule.find().sort({ createdAt: -1 });
    return successResponse(res, {
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get schedule by ID
 * GET /api/schedules/:id
 */
const getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await WorkingSchedule.findById(id);

    if (!schedule) {
      return next(new AppError('Working schedule not found', 404));
    }

    return successResponse(res, {
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create working schedule (automatically calculates weekly hours)
 * POST /api/schedules
 */
const createSchedule = async (req, res, next) => {
  try {
    const existing = await WorkingSchedule.findOne({ name: req.body.name });
    if (existing) {
      return next(new AppError(`Schedule with name '${req.body.name}' already exists`, 409));
    }

    const schedule = new WorkingSchedule(req.body);
    await schedule.save();

    return successResponse(res, {
      status: 201,
      message: 'Working schedule created successfully',
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update working schedule
 * PUT /api/schedules/:id
 */
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await WorkingSchedule.findById(id);
    if (!schedule) {
      return next(new AppError('Working schedule not found', 404));
    }

    Object.assign(schedule, req.body);
    await schedule.save();

    return successResponse(res, {
      message: 'Working schedule updated successfully',
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete working schedule
 * DELETE /api/schedules/:id
 */
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await WorkingSchedule.findByIdAndDelete(id);
    if (!schedule) {
      return next(new AppError('Working schedule not found', 404));
    }

    return successResponse(res, {
      message: 'Working schedule deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
