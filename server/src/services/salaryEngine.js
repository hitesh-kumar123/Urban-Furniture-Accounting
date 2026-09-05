const SalaryStructure = require('../models/SalaryStructure');
const SalaryRule = require('../models/SalaryRule');
const { evaluateFormula } = require('../utils/mathEvaluator');
const { getExpectedScheduleHours } = require('./scheduleService');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Reusable dynamic payroll calculation engine.
 * 
 * Flow:
 * 1. Load and sort salary rules by sequence
 * 2. Build initial variable context (CONTRACT_WAGE, WORKED_DAYS, WORKED_HOURS, etc.)
 * 3. Evaluate each rule sequentially:
 *    - Fixed: rule.fixedAmount
 *    - Percentage: (rule.percentage / 100) * baseAmount
 *    - Formula: mathjs evaluation
 * 4. Progressively enrich context for downstream rules (e.g. GROSS, PF, TAX, NET)
 * 5. Aggregate Basic, Allowances, Gross, Deductions, Net totals
 */
const calculateSalary = async ({
  employee,
  contract,
  salaryStructure,
  attendanceRecords = [],
  timeOffRecords = [],
  payrollPeriod,
  workingSchedule = null
}) => {
  if (!contract) {
    throw new AppError('Cannot calculate salary without a valid contract', 400);
  }

  // 1. Fetch and populate structure rules if not already loaded
  let rules = [];
  if (salaryStructure.rules && salaryStructure.rules.length > 0 && salaryStructure.rules[0].code) {
    rules = salaryStructure.rules.filter((r) => r.active !== false);
  } else {
    const structureDoc = await SalaryStructure.findById(salaryStructure._id || salaryStructure).populate({
      path: 'rules',
      match: { active: true }
    });
    if (!structureDoc) {
      throw new AppError('Salary structure not found for calculation', 404);
    }
    rules = structureDoc.rules || [];
  }

  if (rules.length === 0) {
    throw new AppError('Salary structure has no active rules configured', 400);
  }

  // 2. Sort rules by sequence ascending
  rules.sort((a, b) => a.sequence - b.sequence);

  // 3. Calculate attendance and leave metrics
  const pStart = new Date(payrollPeriod.start || payrollPeriod.periodStart);
  const pEnd = new Date(payrollPeriod.end || payrollPeriod.periodEnd);

  const scheduleInfo = getExpectedScheduleHours(workingSchedule, pStart, pEnd);

  let workedHours = 0;
  let workedDays = 0;

  if (attendanceRecords && attendanceRecords.length > 0) {
    attendanceRecords.forEach((att) => {
      if (att.status === 'Present' || att.status === 'Overtime') {
        workedDays += 1;
        workedHours += att.workedHours || 8;
      } else if (att.status === 'Half Day') {
        workedDays += 0.5;
        workedHours += att.workedHours || 4;
      }
    });
  } else {
    workedDays = scheduleInfo.expectedDays > 0 ? scheduleInfo.expectedDays : 30;
    workedHours = scheduleInfo.expectedHours > 0 ? scheduleInfo.expectedHours : workedDays * 8;
  }

  let approvedLeaveDays = 0;
  if (timeOffRecords && timeOffRecords.length > 0) {
    approvedLeaveDays = timeOffRecords.reduce((acc, req) => acc + (req.duration || 0), 0);
  }

  // 4. Initialize Evaluation Context
  const context = {
    CONTRACT_WAGE: contract.wage || 0,
    WAGE: contract.wage || 0,
    WORKED_DAYS: workedDays,
    WORKED_HOURS: workedHours,
    TOTAL_SCHEDULE_HOURS: scheduleInfo.expectedHours || 160,
    APPROVED_LEAVE_DAYS: approvedLeaveDays,
    BASIC: 0,
    ALLOWANCES: 0,
    GROSS: 0,
    DEDUCTIONS: 0,
    NET: 0
  };

  const ruleBreakdown = [];
  let categoryBasic = 0;
  let categoryAllowances = 0;
  let categoryDeductions = 0;

  // 5. Evaluate each rule in sequence
  for (const rule of rules) {
    let ruleAmount = 0;
    let formulaOrBase = '';

    if (rule.calculationType === 'Fixed') {
      ruleAmount = rule.fixedAmount || 0;
      formulaOrBase = `Fixed: ${ruleAmount}`;
    } else if (rule.calculationType === 'Percentage') {
      const baseKey = (rule.percentageBaseRuleCode || 'BASIC').toUpperCase();
      const baseAmount = context[baseKey] !== undefined ? context[baseKey] : (context.BASIC || 0);
      ruleAmount = Math.round(((rule.percentage / 100) * baseAmount + Number.EPSILON) * 100) / 100;
      formulaOrBase = `${rule.percentage}% of ${baseKey} (${baseAmount})`;
    } else if (rule.calculationType === 'Formula') {
      ruleAmount = evaluateFormula(rule.formula, context);
      formulaOrBase = rule.formula;
    }

    // Save rule result to context under its rule code
    const ruleCodeUpper = rule.code.toUpperCase();
    context[ruleCodeUpper] = ruleAmount;

    // Track running totals by category
    if (rule.category === 'Basic') {
      categoryBasic += ruleAmount;
      context.BASIC = categoryBasic;
    } else if (rule.category === 'Allowances') {
      categoryAllowances += ruleAmount;
      context.ALLOWANCES = categoryAllowances;
    } else if (rule.category === 'Deductions') {
      categoryDeductions += ruleAmount;
      context.DEDUCTIONS = categoryDeductions;
    }

    // Update GROSS and NET in context for subsequent formulas
    if (context.GROSS === 0 || rule.category === 'Basic' || rule.category === 'Allowances') {
      context.GROSS = categoryBasic + categoryAllowances;
    }
    context.NET = Math.max(0, context.GROSS - categoryDeductions);

    ruleBreakdown.push({
      rule: rule._id,
      code: rule.code,
      name: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      calculationType: rule.calculationType,
      amount: ruleAmount,
      formulaOrBase
    });
  }

  // 6. Aggregate final totals
  const totalBasic = Math.round((categoryBasic + Number.EPSILON) * 100) / 100;
  const totalAllowances = Math.round((categoryAllowances + Number.EPSILON) * 100) / 100;
  const totalGross = Math.round(((totalBasic + totalAllowances) + Number.EPSILON) * 100) / 100;
  const totalDeductions = Math.round((categoryDeductions + Number.EPSILON) * 100) / 100;
  const totalNet = Math.round((Math.max(0, totalGross - totalDeductions) + Number.EPSILON) * 100) / 100;

  return {
    metrics: {
      workedDays,
      workedHours,
      totalScheduleHours: scheduleInfo.expectedHours,
      approvedLeaveDays
    },
    basic: totalBasic,
    allowances: totalAllowances,
    gross: totalGross,
    deductions: totalDeductions,
    net: totalNet,
    ruleBreakdown,
    context
  };
};

module.exports = {
  calculateSalary
};
