const TimeOffRequest = require('../models/TimeOffRequest');
const LeaveAllocation = require('../models/LeaveAllocation');
const TimeOffType = require('../models/TimeOffType');
const { AppError } = require('../middleware/errorMiddleware');
const { withTransaction } = require('../config/db');

/**
 * Gets the current leave balance for an employee for a specific Time Off Type.
 * 
 * @param {string} employeeId 
 * @param {string} timeOffTypeId 
 * @param {Date} [referenceDate=new Date()]
 * @returns {Promise<{ allocated: number, taken: number, remaining: number }>}
 */
const getLeaveBalance = async (employeeId, timeOffTypeId, referenceDate = new Date()) => {
  const refDate = new Date(referenceDate);

  const allocations = await LeaveAllocation.find({
    employee: employeeId,
    timeOffType: timeOffTypeId,
    status: 'Approved',
    validityStart: { $lte: refDate },
    validityEnd: { $gte: refDate }
  });

  const totals = allocations.reduce(
    (acc, item) => {
      acc.allocated += item.allocatedAmount || 0;
      acc.taken += item.takenAmount || 0;
      acc.remaining += item.remainingAmount || 0;
      return acc;
    },
    { allocated: 0, taken: 0, remaining: 0 }
  );

  return totals;
};

/**
 * Approves a Time Off Request.
 * Business Rule:
 * When a leave request is approved and the Time Off Type requires allocation:
 * -> automatically consume the corresponding leave allocation
 * -> update taken amount
 * -> update remaining balance
 * 
 * @param {string} requestId 
 * @param {string} approvedByUserId 
 * @returns {Promise<TimeOffRequest>}
 */
const approveLeaveRequest = async (requestId, approvedByUserId) => {
  return await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    const request = await TimeOffRequest.findById(requestId).populate('timeOffType').setOptions(opts);
    if (!request) {
      throw new AppError('Time off request not found', 404);
    }

    if (request.status !== 'Pending' && request.status !== 'Draft') {
      throw new AppError(`Cannot approve request in '${request.status}' status`, 400);
    }

    const timeOffType = request.timeOffType;

    // Check allocation if required
    if (timeOffType && timeOffType.allocationRequired) {
      const activeAllocations = await LeaveAllocation.find({
        employee: request.employee,
        timeOffType: timeOffType._id,
        status: 'Approved',
        validityStart: { $lte: request.startDate },
        validityEnd: { $gte: request.endDate }
      }).setOptions(opts);

      const totalRemaining = activeAllocations.reduce((acc, alloc) => acc + alloc.remainingAmount, 0);

      if (totalRemaining < request.duration) {
        throw new AppError(
          `Insufficient leave balance. Requested: ${request.duration} ${timeOffType.unit}, Available: ${totalRemaining} ${timeOffType.unit}`,
          400
        );
      }

      // Deduct from allocation(s)
      let needed = request.duration;
      for (const allocation of activeAllocations) {
        if (needed <= 0) break;
        const availableInAlloc = allocation.remainingAmount;
        const deduct = Math.min(availableInAlloc, needed);
        allocation.takenAmount = (allocation.takenAmount || 0) + deduct;
        allocation.remainingAmount = (allocation.allocatedAmount || 0) - allocation.takenAmount;
        await allocation.save(opts);
        needed -= deduct;
      }
    }

    request.status = 'Approved';
    request.approvedBy = approvedByUserId;
    request.approvedAt = new Date();
    await request.save(opts);

    return request;
  });
};

/**
 * Refuses a Time Off Request.
 * 
 * @param {string} requestId 
 * @param {string} refusedByUserId 
 * @param {string} rejectionReason 
 * @returns {Promise<TimeOffRequest>}
 */
const refuseLeaveRequest = async (requestId, refusedByUserId, rejectionReason) => {
  const request = await TimeOffRequest.findById(requestId);
  if (!request) {
    throw new AppError('Time off request not found', 404);
  }

  if (request.status !== 'Pending' && request.status !== 'Draft') {
    throw new AppError(`Cannot refuse request in '${request.status}' status`, 400);
  }

  request.status = 'Refused';
  request.approvedBy = refusedByUserId;
  request.approvedAt = new Date();
  request.rejectionReason = rejectionReason || 'Request refused by manager';
  await request.save();

  return request;
};

module.exports = {
  getLeaveBalance,
  approveLeaveRequest,
  refuseLeaveRequest
};
