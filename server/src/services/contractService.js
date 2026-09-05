const Contract = require('../models/Contract');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Finds the contract applicable to an employee during a given payroll period.
 * 
 * Business Rule:
 * Employees can have historical contracts.
 * Payroll MUST use the contract applicable to the selected payroll period.
 * The applicable contract must have:
 *   contract.startDate <= periodEnd AND (contract.endDate >= periodStart OR contract.endDate == null)
 * 
 * @param {string} employeeId 
 * @param {{ start: Date | string, end: Date | string }} payrollPeriod 
 * @returns {Promise<Contract>}
 */
const getApplicableContract = async (employeeId, payrollPeriod) => {
  const pStart = new Date(payrollPeriod.start || payrollPeriod.periodStart);
  const pEnd = new Date(payrollPeriod.end || payrollPeriod.periodEnd);

  if (isNaN(pStart.getTime()) || isNaN(pEnd.getTime())) {
    throw new AppError('Invalid payroll period dates provided for contract lookup', 400);
  }

  // Find active or historical contracts that overlap the payroll period
  const query = {
    employee: employeeId,
    status: { $in: ['Active', 'Expired', 'Draft'] },
    startDate: { $lte: pEnd },
    $or: [
      { endDate: null },
      { endDate: { $gte: pStart } }
    ]
  };

  // Find matching contracts, sort by startDate descending to pick the most relevant applicable contract
  const contract = await Contract.findOne(query)
    .sort({ startDate: -1 })
    .populate('salaryStructure')
    .populate('workingSchedule');

  return contract;
};

/**
 * Validates that a new or updated contract does not conflict/overlap with an existing active contract
 * for the same employee.
 * 
 * @param {string} employeeId
 * @param {Date | string} startDate
 * @param {Date | string | null} endDate
 * @param {string | null} excludeContractId
 */
const validateNoOverlappingContract = async (employeeId, startDate, endDate, excludeContractId = null) => {
  const sDate = new Date(startDate);
  const eDate = endDate ? new Date(endDate) : null;

  const query = {
    employee: employeeId,
    status: { $in: ['Active', 'Draft'] },
    ...(excludeContractId ? { _id: { $ne: excludeContractId } } : {})
  };

  if (eDate) {
    query.startDate = { $lte: eDate };
    query.$or = [{ endDate: null }, { endDate: { $gte: sDate } }];
  } else {
    // Open-ended contract overlaps with anything ending after sDate or open-ended
    query.$or = [{ endDate: null }, { endDate: { $gte: sDate } }];
  }

  const overlapping = await Contract.findOne(query);
  if (overlapping) {
    throw new AppError(
      `Concurrent active contract conflict detected. Contract '${overlapping.name}' already covers this timeframe.`,
      400
    );
  }
};

module.exports = {
  getApplicableContract,
  validateNoOverlappingContract
};
