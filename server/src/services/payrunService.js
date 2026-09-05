const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const TimeOffRequest = require('../models/TimeOffRequest');
const { getApplicableContract } = require('./contractService');
const { calculateSalary } = require('./salaryEngine');
const { AppError } = require('../middleware/errorMiddleware');
const { withTransaction } = require('../config/db');

/**
 * Finds eligible employees for a payrun based on active status and having an applicable contract.
 */
const getEligibleEmployees = async (salaryStructureId, periodStart, periodEnd) => {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const activeEmployees = await Employee.find({
    employeeStatus: { $in: ['Active', 'Probation'] }
  }).populate('workingSchedule');

  const eligible = [];

  for (const emp of activeEmployees) {
    const contract = await getApplicableContract(emp._id, { start: pStart, end: pEnd });
    if (contract) {
      eligible.push({
        employee: emp,
        applicableContract: contract,
        matchesSelectedStructure: contract.salaryStructure?._id?.toString() === salaryStructureId?.toString()
      });
    }
  }

  return eligible;
};

/**
 * Computes payroll for all selected employees in a Payrun.
 * Generates Payslip records, calculates rule breakdowns, and checks for warnings.
 */
const computePayrun = async (payrunId) => {
  return await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    const payrun = await Payrun.findById(payrunId)
      .populate('salaryStructure')
      .populate('selectedEmployees')
      .setOptions(opts);

    if (!payrun) {
      throw new AppError('Payrun not found', 404);
    }

    if (['Validated', 'Paid', 'PayslipsSent'].includes(payrun.status)) {
      throw new AppError(`Cannot recompute a payrun with status '${payrun.status}'`, 400);
    }

    const { periodStart, periodEnd, salaryStructure, selectedEmployees } = payrun;
    const warnings = [];
    const payslipIds = [];

    let totalBasic = 0;
    let totalAllowances = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of selectedEmployees) {
      const empId = emp._id;
      const empWarnings = [];

      // 1. Resolve applicable contract
      const contract = await getApplicableContract(empId, { start: periodStart, end: periodEnd });
      if (!contract) {
        const msg = `Missing applicable contract for employee ${emp.firstName} ${emp.lastName} (${emp.employeeId}) during period.`;
        warnings.push({ employee: empId, message: msg, level: 'Critical' });
        empWarnings.push(msg);
        continue;
      }

      // Check bank details
      if (!emp.bankAccount || !emp.bankAccount.accountNumber) {
        const msg = `Missing bank account details for employee ${emp.firstName} ${emp.lastName}.`;
        warnings.push({ employee: empId, message: msg, level: 'Warning' });
        empWarnings.push(msg);
      }

      // 2. Duplicate payslip check (in a DIFFERENT payrun)
      const duplicatePayslip = await Payslip.findOne({
        employee: empId,
        'payrollPeriod.start': periodStart,
        'payrollPeriod.end': periodEnd,
        payrun: { $ne: payrun._id },
        status: { $ne: 'Cancelled' }
      }).setOptions(opts);

      if (duplicatePayslip) {
        const msg = `Duplicate payslip warning: A payslip already exists for ${emp.firstName} ${emp.lastName} for this period in another payrun.`;
        warnings.push({ employee: empId, message: msg, level: 'Critical' });
        empWarnings.push(msg);
        // Do not attempt to re-insert duplicate payslip
        continue;
      }

      // 3. Load attendance records in period
      const attendance = await Attendance.find({
        employee: empId,
        date: { $gte: periodStart, $lte: periodEnd }
      }).setOptions(opts);

      // 4. Load approved leave records in period
      const timeOff = await TimeOffRequest.find({
        employee: empId,
        status: 'Approved',
        startDate: { $lte: periodEnd },
        endDate: { $gte: periodStart }
      }).setOptions(opts);

      // 5. Execute dynamic salary calculation engine
      const calcResult = await calculateSalary({
        employee: emp,
        contract,
        salaryStructure: contract.salaryStructure || salaryStructure,
        attendanceRecords: attendance,
        timeOffRecords: timeOff,
        payrollPeriod: { start: periodStart, end: periodEnd },
        workingSchedule: contract.workingSchedule || emp.workingSchedule
      });

      // 6. Find or create Payslip record
      let payslip = await Payslip.findOne({
        employee: empId,
        payrun: payrun._id
      }).setOptions(opts);

      if (!payslip) {
        payslip = new Payslip({
          employee: empId,
          payrun: payrun._id,
          contract: contract._id,
          salaryStructure: salaryStructure._id,
          payrollPeriod: { start: periodStart, end: periodEnd }
        });
      }

      payslip.contract = contract._id;
      payslip.salaryStructure = salaryStructure._id;
      payslip.payrollPeriod = { start: periodStart, end: periodEnd };
      payslip.metrics = calcResult.metrics;
      payslip.basic = calcResult.basic;
      payslip.allowances = calcResult.allowances;
      payslip.gross = calcResult.gross;
      payslip.deductions = calcResult.deductions;
      payslip.net = calcResult.net;
      payslip.ruleBreakdown = calcResult.ruleBreakdown;
      payslip.warnings = empWarnings;
      payslip.status = 'Draft';

      await payslip.save(opts);

      payslipIds.push(payslip._id);
      totalBasic += calcResult.basic;
      totalAllowances += calcResult.allowances;
      totalGross += calcResult.gross;
      totalDeductions += calcResult.deductions;
      totalNet += calcResult.net;
    }

    payrun.payslips = payslipIds;
    payrun.warnings = warnings;
    payrun.totals = {
      totalBasic: Math.round((totalBasic + Number.EPSILON) * 100) / 100,
      totalAllowances: Math.round((totalAllowances + Number.EPSILON) * 100) / 100,
      totalGross: Math.round((totalGross + Number.EPSILON) * 100) / 100,
      totalDeductions: Math.round((totalDeductions + Number.EPSILON) * 100) / 100,
      totalNet: Math.round((totalNet + Number.EPSILON) * 100) / 100,
      employeeCount: payslipIds.length
    };
    payrun.status = 'Computed';

    await payrun.save(opts);
    return payrun;
  });
};

/**
 * Validates a computed Payrun.
 * Checks for critical warnings before allowing progression to Validated.
 */
const validatePayrun = async (payrunId) => {
  return await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    const payrun = await Payrun.findById(payrunId).setOptions(opts);
    if (!payrun) {
      throw new AppError('Payrun not found', 404);
    }

    if (payrun.status !== 'Computed') {
      throw new AppError(`Payrun must be in 'Computed' status before validation. Current: '${payrun.status}'`, 400);
    }

    const criticalWarnings = (payrun.warnings || []).filter((w) => w.level === 'Critical');
    if (criticalWarnings.length > 0) {
      const messages = criticalWarnings.map((w) => w.message);
      throw new AppError('Cannot validate payrun due to critical warnings', 400, messages);
    }

    payrun.status = 'Validated';
    payrun.finalizedAt = new Date();
    await payrun.save(opts);

    // Update payslips status to Validated
    await Payslip.updateMany(
      { payrun: payrun._id },
      { $set: { status: 'Validated' } },
      opts
    );

    return payrun;
  });
};

/**
 * Marks a Validated Payrun as Paid.
 */
const markPayrunPaid = async (payrunId) => {
  return await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    const payrun = await Payrun.findById(payrunId).setOptions(opts);
    if (!payrun) {
      throw new AppError('Payrun not found', 404);
    }

    if (payrun.status !== 'Validated') {
      throw new AppError(`Payrun must be in 'Validated' status before marking as Paid. Current: '${payrun.status}'`, 400);
    }

    payrun.status = 'Paid';
    payrun.paidAt = new Date();
    await payrun.save(opts);

    // Update payslips status to Paid
    await Payslip.updateMany(
      { payrun: payrun._id },
      { $set: { status: 'Paid' } },
      opts
    );

    return payrun;
  });
};

module.exports = {
  getEligibleEmployees,
  computePayrun,
  validatePayrun,
  markPayrunPaid
};
