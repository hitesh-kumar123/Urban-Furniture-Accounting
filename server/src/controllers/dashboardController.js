const { getPayrollDashboardMetrics } = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Get aggregated live payroll and HR dashboard analytics
 * GET /api/dashboard/payroll
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const { periodStart, periodEnd, department, employeeType, attendancePeriod } = req.query;

    const metrics = await getPayrollDashboardMetrics({
      periodStart,
      periodEnd,
      department,
      employeeType,
      attendancePeriod
    });

    return successResponse(res, {
      message: 'Dashboard metrics calculated from live database data',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dedicated attendance overview KPI aggregation
 * GET /api/dashboard/attendance-overview
 */
const getAttendanceOverview = async (req, res, next) => {
  try {
    const { periodStart, periodEnd, department, employeeType, attendancePeriod } = req.query;

    const metrics = await getPayrollDashboardMetrics({
      periodStart,
      periodEnd,
      department,
      employeeType,
      attendancePeriod
    });

    return successResponse(res, {
      message: 'Attendance overview metrics',
      data: {
        attendance: metrics.attendance,
        headcount: metrics.headcount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getAttendanceOverview
};
