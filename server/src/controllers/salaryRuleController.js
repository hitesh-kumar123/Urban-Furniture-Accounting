const SalaryRule = require('../models/SalaryRule');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all salary rules
 * GET /api/salary-rules
 */
const getSalaryRules = async (req, res, next) => {
  try {
    const { category, active } = req.query;
    const query = {};
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';

    const rules = await SalaryRule.find(query).sort({ sequence: 1 });
    return successResponse(res, { data: rules });
  } catch (error) {
    next(error);
  }
};

/**
 * Get salary rule by ID
 * GET /api/salary-rules/:id
 */
const getSalaryRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await SalaryRule.findById(id);
    if (!rule) {
      return next(new AppError('Salary rule not found', 404));
    }
    return successResponse(res, { data: rule });
  } catch (error) {
    next(error);
  }
};

/**
 * Create salary rule
 * POST /api/salary-rules
 */
const createSalaryRule = async (req, res, next) => {
  try {
    const existing = await SalaryRule.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return next(new AppError(`Salary rule with code '${req.body.code}' already exists`, 409));
    }

    const rule = await SalaryRule.create({
      ...req.body,
      code: req.body.code.toUpperCase()
    });

    return successResponse(res, {
      status: 201,
      message: 'Salary rule created successfully',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update salary rule
 * PUT /api/salary-rules/:id
 */
const updateSalaryRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await SalaryRule.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!rule) {
      return next(new AppError('Salary rule not found', 404));
    }

    return successResponse(res, {
      message: 'Salary rule updated successfully',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete salary rule
 * DELETE /api/salary-rules/:id
 */
const deleteSalaryRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await SalaryRule.findByIdAndDelete(id);
    if (!rule) {
      return next(new AppError('Salary rule not found', 404));
    }

    return successResponse(res, {
      message: 'Salary rule deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule
};
