const Contract = require('../models/Contract');
const { getApplicableContract, validateNoOverlappingContract } = require('../services/contractService');
const { successResponse } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorMiddleware');
const { ensureEmployeeForUser } = require('../services/employeeHelper');

/**
 * Get all contracts with filtering
 * GET /api/contracts
 */
const getContracts = async (req, res, next) => {
  try {
    const { employee, status, department } = req.query;

    const query = {};
    if (req.user.role === 'Employee') {
      const emp = await ensureEmployeeForUser(req.user);
      query.employee = emp ? emp._id : req.user.employee;
    } else {
      if (employee) query.employee = employee;
      if (department) query.department = department;
    }
    if (status) query.status = status;

    const contracts = await Contract.find(query)
      .populate('employee', 'firstName lastName email employeeId department jobPosition')
      .populate('salaryStructure', 'name code')
      .populate('workingSchedule', 'name totalWeeklyHours')
      .sort({ startDate: -1 });

    return successResponse(res, {
      data: contracts,
      message: 'Contracts list'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contract by ID
 * GET /api/contracts/:id
 */
const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id)
      .populate('employee')
      .populate('salaryStructure')
      .populate('workingSchedule');

    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    return successResponse(res, {
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find applicable contract for an employee during a period
 * GET /api/contracts/applicable?employeeId=...&startDate=...&endDate=...
 */
const getApplicableContractForPeriod = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
      return next(new AppError('employeeId, startDate, and endDate query parameters are required', 400));
    }

    const contract = await getApplicableContract(employeeId, { start: startDate, end: endDate });

    if (!contract) {
      return successResponse(res, {
        data: null,
        message: 'No applicable contract found for this employee and period'
      });
    }

    return successResponse(res, {
      data: contract,
      message: 'Applicable contract for period'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create contract
 * POST /api/contracts
 */
const createContract = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.state && !data.status) data.status = data.state;
    if (data.endDate === '') data.endDate = null;
    if (data.workingSchedule === '') data.workingSchedule = null;

    const { employee, startDate, endDate, status } = data;

    if (status !== 'Draft') {
      await validateNoOverlappingContract(employee, startDate, endDate);
    }

    const contract = await Contract.create(data);
    const populated = await Contract.findById(contract._id)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('salaryStructure', 'name code')
      .populate('workingSchedule', 'name totalWeeklyHours');

    return successResponse(res, {
      status: 201,
      message: 'Contract created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contract
 * PUT /api/contracts/:id
 */
const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const current = await Contract.findById(id);
    if (!current) {
      return next(new AppError('Contract not found', 404));
    }

    const data = { ...req.body };
    if (data.state && !data.status) data.status = data.state;
    if (data.endDate === '') data.endDate = null;
    if (data.workingSchedule === '') data.workingSchedule = null;

    const newStartDate = data.startDate || current.startDate;
    const newEndDate = data.endDate !== undefined ? data.endDate : current.endDate;
    const newStatus = data.status || current.status;

    if (newStatus !== 'Draft') {
      await validateNoOverlappingContract(current.employee, newStartDate, newEndDate, id);
    }

    const contract = await Contract.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    })
      .populate('employee', 'firstName lastName email employeeId')
      .populate('salaryStructure', 'name code')
      .populate('workingSchedule', 'name totalWeeklyHours');

    return successResponse(res, {
      message: 'Contract updated successfully',
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

const Payslip = require('../models/Payslip');

/**
 * Delete contract
 * DELETE /api/contracts/:id
 */
const deleteContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) {
      return next(new AppError('Contract not found', 404));
    }

    const linkedPayslip = await Payslip.findOne({ contract: id });
    if (linkedPayslip) {
      return next(
        new AppError(
          'Cannot delete this contract because payslips have already been generated under it. To deactivate, please set status to Expired or Cancelled instead.',
          400
        )
      );
    }

    await Contract.findByIdAndDelete(id);

    return successResponse(res, {
      message: 'Contract deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContracts,
  getContractById,
  getApplicableContractForPeriod,
  createContract,
  updateContract,
  deleteContract
};
