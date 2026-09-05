const SalaryStructure = require('../models/SalaryStructure');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all salary structures
 * GET /api/salary-structures
 */
const getSalaryStructures = async (req, res, next) => {
  try {
    const { active } = req.query;
    const query = {};
    if (active !== undefined) query.active = active === 'true';

    const structures = await SalaryStructure.find(query)
      .populate('rules')
      .sort({ createdAt: -1 });

    return successResponse(res, { data: structures });
  } catch (error) {
    next(error);
  }
};

/**
 * Get salary structure by ID
 * GET /api/salary-structures/:id
 */
const getSalaryStructureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await SalaryStructure.findById(id).populate('rules');

    if (!structure) {
      return next(new AppError('Salary structure not found', 404));
    }

    return successResponse(res, { data: structure });
  } catch (error) {
    next(error);
  }
};

/**
 * Create salary structure
 * POST /api/salary-structures
 */
const createSalaryStructure = async (req, res, next) => {
  try {
    const existing = await SalaryStructure.findOne({
      $or: [{ name: req.body.name }, { code: req.body.code.toUpperCase() }]
    });

    if (existing) {
      return next(new AppError('Salary structure with this name or code already exists', 409));
    }

    const structure = await SalaryStructure.create({
      ...req.body,
      code: req.body.code.toUpperCase()
    });

    const populated = await SalaryStructure.findById(structure._id).populate('rules');

    return successResponse(res, {
      status: 201,
      message: 'Salary structure created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update salary structure
 * PUT /api/salary-structures/:id
 */
const updateSalaryStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await SalaryStructure.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).populate('rules');

    if (!structure) {
      return next(new AppError('Salary structure not found', 404));
    }

    return successResponse(res, {
      message: 'Salary structure updated successfully',
      data: structure
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete salary structure
 * DELETE /api/salary-structures/:id
 */
const deleteSalaryStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await SalaryStructure.findByIdAndDelete(id);

    if (!structure) {
      return next(new AppError('Salary structure not found', 404));
    }

    return successResponse(res, {
      message: 'Salary structure deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure
};
