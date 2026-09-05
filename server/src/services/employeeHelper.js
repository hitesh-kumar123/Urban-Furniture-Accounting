const Employee = require('../models/Employee');
const User = require('../models/User');
const TimeOffType = require('../models/TimeOffType');
const LeaveAllocation = require('../models/LeaveAllocation');

/**
 * Ensures an employee profile and statutory leave allocations exist for a user.
 * Guarantees seamless leave applications and attendance tracking for all users.
 * 
 * @param {Object} user 
 * @returns {Promise<Employee>}
 */
const ensureEmployeeForUser = async (user) => {
  if (!user) return null;

  let emp = null;

  // 1. Check if user already has an employee reference
  if (user.employee) {
    const empId = user.employee._id || user.employee;
    emp = await Employee.findById(empId);
  }

  // 2. If not found by ID, look up by email
  if (!emp && user.email) {
    emp = await Employee.findOne({ email: user.email.toLowerCase() });
  }

  // 3. Only auto-create an active Employee profile if role is 'Employee'
  if (!emp) {
    if (user.role && user.role !== 'Employee') {
      return null;
    }

    const rawName = (user.name || 'Employee').trim();
    const parts = rawName.split(' ');
    const firstName = parts[0] || 'Employee';
    const lastName = parts.slice(1).join(' ') || 'Staff';

    const count = await Employee.countDocuments();
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;

    emp = await Employee.create({
      employeeId,
      firstName,
      lastName,
      email: user.email.toLowerCase(),
      jobPosition: 'Associate Staff',
      department: 'Engineering',
      employeeStatus: 'Active',
      employeeType: 'Full-Time',
      joiningDate: new Date(),
      user: user._id
    });
  }

  // 4. Ensure bi-directional link between User and Employee
  if (emp) {
    if (!user.employee || user.employee.toString() !== emp._id.toString()) {
      user.employee = emp._id;
      await User.findByIdAndUpdate(user._id, { employee: emp._id });
    }
    if (!emp.user || emp.user.toString() !== user._id.toString()) {
      emp.user = user._id;
      await Employee.findByIdAndUpdate(emp._id, { user: user._id });
    }

    // 5. Ensure statutory leave quotas are allocated for the current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const activeTypes = await TimeOffType.find({ status: 'Active' });
    for (const t of activeTypes) {
      const hasAlloc = await LeaveAllocation.findOne({
        employee: emp._id,
        timeOffType: t._id,
        validityStart: { $lte: endOfYear },
        validityEnd: { $gte: startOfYear }
      });

      if (!hasAlloc) {
        const defaultDays = t.code === 'CL' ? 12 : t.code === 'SL' ? 10 : t.code === 'PL' ? 15 : 12;
        await LeaveAllocation.create({
          employee: emp._id,
          timeOffType: t._id,
          allocatedAmount: defaultDays,
          takenAmount: 0,
          remainingAmount: defaultDays,
          validityStart: startOfYear,
          validityEnd: endOfYear,
          status: 'Approved',
          remarks: `Standard ${currentYear} Statutory Entitlement`
        });
      }
    }
  }

  return emp;
};

module.exports = {
  ensureEmployeeForUser
};
