const SalaryStructure = require('../models/SalaryStructure');
const Contract = require('../models/Contract');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all salary structures with rule and employee metrics
 * GET /api/salary-structures
 */
const getSalaryStructures = async (req, res, next) => {
  try {
    const { active } = req.query;
    const query = {};
    if (active !== undefined) query.active = active === 'true';

    const structures = await SalaryStructure.find(query)
      .populate('rules')
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate active employee contracts count using each structure
    const contractCounts = await Contract.aggregate([
      { $match: { status: { $in: ['Active', 'Running'] } } },
      { $group: { _id: '$salaryStructure', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    contractCounts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const structuresWithMetrics = structures.map((s) => ({
      ...s,
      rulesCount: s.rules?.length || 0,
      employeeCount: countMap[s._id.toString()] || 0
    }));

    return successResponse(res, { data: structuresWithMetrics });
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
