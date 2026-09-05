const Payrun = require('../models/Payrun');
const {
  getEligibleEmployees,
  computePayrun,
  validatePayrun,
  markPayrunPaid
} = require('../services/payrunService');
const { bulkSendPayrunPayslips } = require('../services/emailService');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all payruns
 * GET /api/payruns
 */
const getPayruns = async (req, res, next) => {
  try {
    const { status, periodStart, periodEnd } = req.query;
    const query = {};

    if (status) query.status = status;
    if (periodStart && periodEnd) {
      query.periodStart = { $gte: new Date(periodStart) };
      query.periodEnd = { $lte: new Date(periodEnd) };
    }

    const payruns = await Payrun.find(query)
      .populate('salaryStructure', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, { data: payruns });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payrun by ID
 * GET /api/payruns/:id
 */
const getPayrunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payrun = await Payrun.findById(id)
      .populate('salaryStructure')
      .populate('selectedEmployees', 'firstName lastName email employeeId department jobPosition bankAccount')
      .populate({
        path: 'payslips',
        populate: { path: 'employee', select: 'firstName lastName email employeeId department' }
      })
      .populate('createdBy', 'name email');

    if (!payrun) {
      return next(new AppError('Payrun not found', 404));
    }

    return successResponse(res, { data: payrun });
  } catch (error) {
    next(error);
  }
};

/**
 * Query eligible employees for a payrun (Step 2 of creation)
 * GET /api/payruns/eligible-employees
 */
const getPayrunEligibleEmployees = async (req, res, next) => {
  try {
    const { salaryStructureId, periodStart, periodEnd } = req.query;

    if (!periodStart || !periodEnd) {
      return next(new AppError('periodStart and periodEnd are required', 400));
    }

    const eligible = await getEligibleEmployees(salaryStructureId, periodStart, periodEnd);

    return successResponse(res, {
      data: eligible,
      message: `Found ${eligible.length} eligible employee(s) with active contracts during period.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Payrun
 * POST /api/payruns
 */
const createPayrun = async (req, res, next) => {
  try {
    const payrun = await Payrun.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'Draft'
    });

    const populated = await Payrun.findById(payrun._id)
      .populate('salaryStructure', 'name code')
      .populate('selectedEmployees', 'firstName lastName email employeeId department');

    return successResponse(res, {
      status: 201,
      message: 'Payrun created successfully. Proceed to compute payslips.',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Payrun
 * PUT /api/payruns/:id
 */
const updatePayrun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payrun = await Payrun.findById(id);
    if (!payrun) {
      return next(new AppError('Payrun not found', 404));
    }

    if (['Validated', 'Paid', 'PayslipsSent'].includes(payrun.status)) {
      return next(new AppError(`Cannot modify a payrun in '${payrun.status}' status`, 400));
    }

    Object.assign(payrun, req.body);
    await payrun.save();

    return successResponse(res, {
      message: 'Payrun updated successfully',
      data: payrun
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compute Payrun (calculates all selected employee payslips)
 * POST /api/payruns/:id/compute
 */
const compute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const computedPayrun = await computePayrun(id);

    return successResponse(res, {
      message: 'Payrun computed successfully. Payslips generated.',
      data: computedPayrun
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate Payrun
 * POST /api/payruns/:id/validate
 */
const validate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedPayrun = await validatePayrun(id);

    return successResponse(res, {
      message: 'Payrun successfully validated and finalized.',
      data: validatedPayrun
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Payrun as Paid
 * POST /api/payruns/:id/mark-paid
 */
const markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paidPayrun = await markPayrunPaid(id);

    return successResponse(res, {
      message: 'Payrun marked as Paid. Employee payslips updated to Paid status.',
      data: paidPayrun
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send bulk payslip emails for a payrun
 * POST /api/payruns/:id/send-payslips
 */
const sendPayslips = async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await bulkSendPayrunPayslips(id);

    return successResponse(res, {
      message: `Payslip email dispatch completed. Sent: ${results.sent}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayruns,
  getPayrunById,
  getPayrunEligibleEmployees,
  createPayrun,
  updatePayrun,
  compute,
  validate,
  markPaid,
  sendPayslips
};
