const Payslip = require('../models/Payslip');
const { generatePayslipPDF } = require('../services/pdfService');
const { sendSinglePayslipEmail } = require('../services/emailService');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Get all payslips with filtering
 * GET /api/payslips
 */
const getPayslips = async (req, res, next) => {
  try {
    const { employee, payrun, status, startDate, endDate } = req.query;
    const query = {};

    // RBAC: Employee role can only view own payslips
    if (req.user.role === 'Employee') {
      if (!req.user.employee) {
        return successResponse(res, { data: [], message: 'No linked employee profile' });
      }
      query.employee = req.user.employee;
    } else if (employee) {
      query.employee = employee;
    }

    if (payrun) query.payrun = payrun;
    if (status) query.status = status;
    if (startDate && endDate) {
      query['payrollPeriod.start'] = { $gte: new Date(startDate) };
      query['payrollPeriod.end'] = { $lte: new Date(endDate) };
    }

    const payslips = await Payslip.find(query)
      .populate('employee', 'firstName lastName email employeeId department jobPosition')
      .populate('payrun', 'name status periodStart periodEnd')
      .populate('salaryStructure', 'name code')
      .sort({ 'payrollPeriod.end': -1 });

    return successResponse(res, { data: payslips });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single payslip by ID
 * GET /api/payslips/:id
 */
const getPayslipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findById(id)
      .populate('employee')
      .populate('contract')
      .populate('salaryStructure')
      .populate('payrun');

    if (!payslip) {
      return next(new AppError('Payslip not found', 404));
    }

    if (req.user.role === 'Employee' && payslip.employee._id.toString() !== req.user.employee?.toString()) {
      return next(new AppError('Forbidden: Access denied to other employee payslips', 403));
    }

    return successResponse(res, { data: payslip });
  } catch (error) {
    next(error);
  }
};

/**
 * Download printable PDF of payslip
 * GET /api/payslips/:id/pdf
 */
const getPayslipPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findById(id).populate('employee');

    if (!payslip) {
      return next(new AppError('Payslip not found', 404));
    }

    if (req.user.role === 'Employee' && payslip.employee._id.toString() !== req.user.employee?.toString()) {
      return next(new AppError('Forbidden: Access denied to other employee payslips', 403));
    }

    const pdfBuffer = await generatePayslipPDF(id);

    const filename = `Payslip_${payslip.employee.employeeId}_${new Date(payslip.payrollPeriod.end).toISOString().slice(0, 7)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Send single payslip via email
 * POST /api/payslips/:id/send-email
 */
const sendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sendSinglePayslipEmail(id);

    if (!result.success) {
      return next(new AppError(`Failed to send email: ${result.error}`, 500));
    }

    return successResponse(res, {
      message: `Payslip emailed successfully to ${result.email}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayslips,
  getPayslipById,
  getPayslipPDF,
  sendEmail
};
