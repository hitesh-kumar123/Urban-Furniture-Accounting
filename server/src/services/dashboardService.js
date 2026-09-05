const mongoose = require('mongoose');
const Payslip = require('../models/Payslip');
const Payrun = require('../models/Payrun');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const TimeOffRequest = require('../models/TimeOffRequest');
const LeaveAllocation = require('../models/LeaveAllocation');
const Contract = require('../models/Contract');

/**
 * Aggregates live payroll & HR dashboard metrics based on dynamic filters.
 * 
 * @param {Object} filters
 * @param {Date | string} [filters.periodStart]
 * @param {Date | string} [filters.periodEnd]
 * @param {string} [filters.department]
 * @param {string} [filters.employeeType]
 * @returns {Promise<Object>}
 */
const getPayrollDashboardMetrics = async (filters = {}) => {
  const { periodStart, periodEnd, department, employeeType } = filters;

  // 1. Build employee filter match stage
  const empMatch = { employeeStatus: { $in: ['Active', 'Probation'] } };
  if (department) empMatch.department = department;
  if (employeeType) empMatch.employeeType = employeeType;

  const activeEmployees = await Employee.find(empMatch);
  const employeeIds = activeEmployees.map((e) => e._id);
  const totalHeadcount = activeEmployees.length;

  // Headcount by department
  const headcountByDept = {};
  activeEmployees.forEach((emp) => {
    headcountByDept[emp.department] = (headcountByDept[emp.department] || 0) + 1;
  });

  // 2. Build payslip filter match
  const payslipMatch = { employee: { $in: employeeIds } };
  if (periodStart && periodEnd) {
    payslipMatch['payrollPeriod.start'] = { $gte: new Date(periodStart) };
    payslipMatch['payrollPeriod.end'] = { $lte: new Date(periodEnd) };
  }

  // Payslip Financial Aggregations
  const payslipStats = await Payslip.aggregate([
    { $match: payslipMatch },
    {
      $group: {
        _id: null,
        totalNetPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$net', 0] }
        },
        totalGross: { $sum: '$gross' },
        totalDeductions: { $sum: '$deductions' },
        totalNet: { $sum: '$net' },
        payslipCount: { $sum: 1 },
        avgSalary: { $avg: '$net' }
      }
    }
  ]);

  const financialSummary = payslipStats[0] || {
    totalNetPaid: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    payslipCount: 0,
    avgSalary: 0
  };

  // Salary Cost by Department
  const salaryByDepartment = await Payslip.aggregate([
    { $match: payslipMatch },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'emp'
      }
    },
    { $unwind: '$emp' },
    {
      $group: {
        _id: '$emp.department',
        totalCost: { $sum: '$gross' },
        netPaid: { $sum: '$net' },
        employeeCount: { $addToSet: '$emp._id' }
      }
    },
    {
      $project: {
        department: '$_id',
        totalCost: { $round: ['$totalCost', 2] },
        netPaid: { $round: ['$netPaid', 2] },
        employeeCount: { $size: '$employeeCount' }
      }
    }
  ]);

  // Monthly Net Salary Trends
  const monthlyTrends = await Payslip.aggregate([
    { $match: { employee: { $in: employeeIds } } },
    {
      $group: {
        _id: {
          year: { $year: '$payrollPeriod.end' },
          month: { $month: '$payrollPeriod.end' }
        },
        totalNet: { $sum: '$net' },
        totalGross: { $sum: '$gross' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]
            }
          ]
        },
        totalNet: { $round: ['$totalNet', 2] },
        totalGross: { $round: ['$totalGross', 2] },
        payslipCount: '$count'
      }
    }
  ]);

  // 3. Attendance Health
  const attendanceMatch = { employee: { $in: employeeIds } };
  if (periodStart && periodEnd) {
    attendanceMatch.date = { $gte: new Date(periodStart), $lte: new Date(periodEnd) };
  }

  const attendanceStats = await Attendance.aggregate([
    { $match: attendanceMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalWorkedHours: { $sum: '$workedHours' },
        manualEdits: { $sum: { $cond: ['$isManualCorrection', 1, 0] } }
      }
    }
  ]);

  const attendanceSummary = {
    present: 0,
    late: 0,
    absent: 0,
    overtime: 0,
    missingCheckout: 0,
    halfDay: 0,
    totalWorkedHours: 0,
    manualCorrections: 0
  };

  attendanceStats.forEach((stat) => {
    if (stat._id === 'Present') attendanceSummary.present = stat.count;
    if (stat._id === 'Late') attendanceSummary.late = stat.count;
    if (stat._id === 'Absent') attendanceSummary.absent = stat.count;
    if (stat._id === 'Overtime') attendanceSummary.overtime = stat.count;
    if (stat._id === 'Missing Check-out') attendanceSummary.missingCheckout = stat.count;
    if (stat._id === 'Half Day') attendanceSummary.halfDay = stat.count;
    attendanceSummary.totalWorkedHours += stat.totalWorkedHours || 0;
    attendanceSummary.manualCorrections += stat.manualEdits || 0;
  });

  // 4. Leave Metrics
  const leaveMatch = { employee: { $in: employeeIds } };
  if (periodStart && periodEnd) {
    leaveMatch.startDate = { $lte: new Date(periodEnd) };
    leaveMatch.endDate = { $gte: new Date(periodStart) };
  }

  const leaveRequests = await TimeOffRequest.aggregate([
    { $match: leaveMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$duration' }
      }
    }
  ]);

  const leaveSummary = {
    pending: 0,
    approved: 0,
    refused: 0,
    approvedDays: 0
  };

  leaveRequests.forEach((req) => {
    if (req._id === 'Pending') leaveSummary.pending = req.count;
    if (req._id === 'Approved') {
      leaveSummary.approved = req.count;
      leaveSummary.approvedDays = req.totalDays;
    }
    if (req._id === 'Refused') leaveSummary.refused = req.count;
  });

  // 5. System Health / Warnings
  const payrunsCountByStatus = await Payrun.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const payrunStatuses = {};
  payrunsCountByStatus.forEach((p) => {
    payrunStatuses[p._id] = p.count;
  });

  // Count employees with missing bank details
  const missingBankCount = await Employee.countDocuments({
    _id: { $in: employeeIds },
    $or: [{ 'bankAccount.accountNumber': '' }, { 'bankAccount.accountNumber': null }]
  });

  return {
    headcount: {
      total: totalHeadcount,
      byDepartment: headcountByDept
    },
    payroll: {
      totalNetPaid: Math.round(((financialSummary.totalNetPaid || 0) + Number.EPSILON) * 100) / 100,
      totalGross: Math.round(((financialSummary.totalGross || 0) + Number.EPSILON) * 100) / 100,
      totalDeductions: Math.round(((financialSummary.totalDeductions || 0) + Number.EPSILON) * 100) / 100,
      payslipsGenerated: financialSummary.payslipCount || 0,
      averageSalary: Math.round(((financialSummary.avgSalary || 0) + Number.EPSILON) * 100) / 100,
      salaryCostByDepartment: salaryByDepartment,
      monthlyTrends,
      payrunStatuses
    },
    attendance: attendanceSummary,
    leave: leaveSummary,
    alerts: {
      missingBankInfoEmployees: missingBankCount,
      pendingLeaveRequests: leaveSummary.pending
    }
  };
};

module.exports = {
  getPayrollDashboardMetrics
};
