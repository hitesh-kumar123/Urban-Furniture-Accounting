const User = require('../models/User');
const Employee = require('../models/Employee');
const { WorkingSchedule } = require('../models/WorkingSchedule');
const Contract = require('../models/Contract');
const Attendance = require('../models/Attendance');
const TimeOffType = require('../models/TimeOffType');
const LeaveAllocation = require('../models/LeaveAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const SalaryRule = require('../models/SalaryRule');
const SalaryStructure = require('../models/SalaryStructure');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const { calculateSalary } = require('../services/salaryEngine');

const seedDatabase = async () => {
  console.log('[Seeder] Cleaning existing database collections...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    WorkingSchedule.deleteMany({}),
    Contract.deleteMany({}),
    Attendance.deleteMany({}),
    TimeOffType.deleteMany({}),
    LeaveAllocation.deleteMany({}),
    TimeOffRequest.deleteMany({}),
    SalaryRule.deleteMany({}),
    SalaryStructure.deleteMany({}),
    Payrun.deleteMany({}),
    Payslip.deleteMany({})
  ]);

  console.log('[Seeder] 1. Creating Working Schedules...');
  const standardDays = [
    { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
    { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
  ];

  const standardSchedule = new WorkingSchedule({
    name: 'Standard 35-Hour Work Week',
    description: 'Monday to Friday, 9:00 AM to 5:00 PM with 1-hour lunch break',
    days: standardDays
  });
  await standardSchedule.save();

  const flexibleSchedule = new WorkingSchedule({
    name: 'Flexible 40-Hour Shift',
    description: 'Monday to Friday 8:30 AM to 5:30 PM with 1-hour break',
    days: [
      { day: 'Monday', isWorkingDay: true, startTime: '08:30', endTime: '17:30', breakMinutes: 60 },
      { day: 'Tuesday', isWorkingDay: true, startTime: '08:30', endTime: '17:30', breakMinutes: 60 },
      { day: 'Wednesday', isWorkingDay: true, startTime: '08:30', endTime: '17:30', breakMinutes: 60 },
      { day: 'Thursday', isWorkingDay: true, startTime: '08:30', endTime: '17:30', breakMinutes: 60 },
      { day: 'Friday', isWorkingDay: true, startTime: '08:30', endTime: '17:30', breakMinutes: 60 },
      { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
      { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
    ]
  });
  await flexibleSchedule.save();

  console.log('[Seeder] 2. Creating Employees...');
  const emp1 = await Employee.create({
    employeeId: 'EMP-001',
    firstName: 'Alex',
    lastName: 'Turner',
    email: 'alex.turner@peoplepay360.com',
    phone: '+1-555-0101',
    department: 'Engineering',
    jobPosition: 'Senior Full-Stack Engineer',
    workingSchedule: standardSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-01-15'),
    bankAccount: {
      bankName: 'JPMorgan Chase',
      accountNumber: '987654321012',
      ifscOrRouting: 'CHASUS33',
      accountHolderName: 'Alex Turner'
    }
  });

  const emp2 = await Employee.create({
    employeeId: 'EMP-002',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.jenkins@peoplepay360.com',
    phone: '+1-555-0102',
    department: 'Product',
    jobPosition: 'Product Manager',
    workingSchedule: standardSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-03-01'),
    bankAccount: {
      bankName: 'Bank of America',
      accountNumber: '876543210987',
      ifscOrRouting: 'BOFAUS3N',
      accountHolderName: 'Sarah Jenkins'
    }
  });

  const emp3 = await Employee.create({
    employeeId: 'EMP-003',
    firstName: 'Michael',
    lastName: 'Chang',
    email: 'michael.chang@peoplepay360.com',
    phone: '+1-555-0103',
    department: 'Marketing',
    jobPosition: 'Growth Marketing Lead',
    workingSchedule: flexibleSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-06-10'),
    bankAccount: {
      bankName: 'Wells Fargo',
      accountNumber: '765432109876',
      ifscOrRouting: 'WFBIUS6S',
      accountHolderName: 'Michael Chang'
    }
  });

  const emp4 = await Employee.create({
    employeeId: 'EMP-004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@peoplepay360.com',
    phone: '+1-555-0104',
    department: 'Design',
    jobPosition: 'Lead UI/UX Designer',
    workingSchedule: standardSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-09-01'),
    bankAccount: {
      bankName: 'Citibank',
      accountNumber: '654321098765',
      ifscOrRouting: 'CITIUS33',
      accountHolderName: 'Emily Davis'
    }
  });

  console.log('[Seeder] 3. Creating Users for all 5 RBAC roles...');
  const commonPassword = 'Password@123';
  const hashedCommon = await User.hashPassword(commonPassword);

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Admin',
    status: 'Active'
  });

  const hrManagerUser = await User.create({
    name: 'Eleanor Vance (HR Manager)',
    email: 'hrmanager@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Manager',
    status: 'Active'
  });

  const payrollUser = await User.create({
    name: 'Patrick Bateman (Payroll User)',
    email: 'payrolluser@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll User',
    status: 'Active'
  });

  const payrollManagerUser = await User.create({
    name: 'Sophia Sterling (Payroll Manager)',
    email: 'payrollmgr@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll Manager',
    status: 'Active'
  });

  const employeeUser = await User.create({
    name: 'Alex Turner (Employee)',
    email: 'alex.turner@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Employee',
    employee: emp1._id,
    status: 'Active'
  });
  await Employee.findByIdAndUpdate(emp1._id, { user: employeeUser._id });

  console.log('[Seeder] 4. Creating Salary Rules...');
  const ruleBasic = await SalaryRule.create({
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'Basic',
    sequence: 10,
    calculationType: 'Formula',
    formula: 'CONTRACT_WAGE * 0.50',
    description: '50% of monthly base contract wage'
  });

  const ruleHra = await SalaryRule.create({
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    category: 'Allowances',
    sequence: 20,
    calculationType: 'Percentage',
    percentage: 40,
    percentageBaseRuleCode: 'BASIC',
    description: '40% of Basic Pay'
  });

  const ruleSpecial = await SalaryRule.create({
    name: 'Special Allowance',
    code: 'SPECIAL_ALLOWANCE',
    category: 'Allowances',
    sequence: 30,
    calculationType: 'Fixed',
    fixedAmount: 1200,
    description: 'Fixed monthly performance & utility allowance'
  });

  const ruleGross = await SalaryRule.create({
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'Gross',
    sequence: 40,
    calculationType: 'Formula',
    formula: 'BASIC + HRA + SPECIAL_ALLOWANCE',
    description: 'Total Gross Earnings before statutory deductions'
  });

  const rulePf = await SalaryRule.create({
    name: 'Provident Fund (PF)',
    code: 'PF',
    category: 'Deductions',
    sequence: 50,
    calculationType: 'Percentage',
    percentage: 12,
    percentageBaseRuleCode: 'BASIC',
    description: '12% of Basic Pay towards employee provident fund'
  });

  const ruleTax = await SalaryRule.create({
    name: 'Professional Tax',
    code: 'PRO_TAX',
    category: 'Deductions',
    sequence: 60,
    calculationType: 'Fixed',
    fixedAmount: 200,
    description: 'Fixed municipal professional tax'
  });

  const ruleTds = await SalaryRule.create({
    name: 'Income Tax (TDS)',
    code: 'TDS',
    category: 'Deductions',
    sequence: 70,
    calculationType: 'Formula',
    formula: 'GROSS * 0.08',
    description: '8% Income Tax deduction on Gross earnings'
  });

  const ruleNet = await SalaryRule.create({
    name: 'Net Salary',
    code: 'NET',
    category: 'Net',
    sequence: 100,
    calculationType: 'Formula',
    formula: 'GROSS - DEDUCTIONS',
    description: 'Take-home payable salary'
  });

  console.log('[Seeder] 5. Creating Salary Structures...');
  const standardStructure = await SalaryStructure.create({
    name: 'Standard Corporate Salary Structure',
    code: 'CORP_STD_2026',
    description: 'Comprehensive salary breakdown with basic, HRA, allowances, PF, and taxes',
    rules: [
      ruleBasic._id,
      ruleHra._id,
      ruleSpecial._id,
      ruleGross._id,
      rulePf._id,
      ruleTax._id,
      ruleTds._id,
      ruleNet._id
    ]
  });

  console.log('[Seeder] 6. Creating Contracts (Current & Historical)...');
  // Historical contract for Alex Turner (2023 - 2024 at $6000/mo)
  await Contract.create({
    employee: emp1._id,
    name: 'Alex Turner - Initial Engineer Contract 2023',
    startDate: new Date('2023-01-15'),
    endDate: new Date('2023-12-31'),
    wage: 6000,
    department: 'Engineering',
    jobPosition: 'Junior Full-Stack Engineer',
    salaryStructure: standardStructure._id,
    workingSchedule: standardSchedule._id,
    status: 'Expired',
    terms: 'Initial 1-year junior contract'
  });

  // Current active contract for Alex Turner ($8500/mo)
  const alexContract = await Contract.create({
    employee: emp1._id,
    name: 'Alex Turner - Senior Engineer Promotion Contract 2024+',
    startDate: new Date('2024-01-01'),
    endDate: null,
    wage: 8500,
    department: 'Engineering',
    jobPosition: 'Senior Full-Stack Engineer',
    salaryStructure: standardStructure._id,
    workingSchedule: standardSchedule._id,
    status: 'Active',
    terms: 'Permanent full-time employment agreement'
  });

  // Sarah Contract ($9000/mo)
  const sarahContract = await Contract.create({
    employee: emp2._id,
    name: 'Sarah Jenkins - Product Lead Contract',
    startDate: new Date('2023-03-01'),
    endDate: null,
    wage: 9000,
    department: 'Product',
    jobPosition: 'Product Manager',
    salaryStructure: standardStructure._id,
    workingSchedule: standardSchedule._id,
    status: 'Active'
  });

  // Michael Contract ($7500/mo)
  const michaelContract = await Contract.create({
    employee: emp3._id,
    name: 'Michael Chang - Growth Marketing Contract',
    startDate: new Date('2023-06-10'),
    endDate: null,
    wage: 7500,
    department: 'Marketing',
    jobPosition: 'Growth Marketing Lead',
    salaryStructure: standardStructure._id,
    workingSchedule: flexibleSchedule._id,
    status: 'Active'
  });

  // Emily Contract ($7800/mo)
  const emilyContract = await Contract.create({
    employee: emp4._id,
    name: 'Emily Davis - Design Lead Contract',
    startDate: new Date('2023-09-01'),
    endDate: null,
    wage: 7800,
    department: 'Design',
    jobPosition: 'Lead UI/UX Designer',
    salaryStructure: standardStructure._id,
    workingSchedule: standardSchedule._id,
    status: 'Active'
  });

  console.log('[Seeder] 7. Creating Time Off Types, Allocations & Requests...');
  const paidLeaveType = await TimeOffType.create({
    name: 'Paid Annual Leave',
    code: 'PAID_ANNUAL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Standard paid vacation and annual off'
  });

  const sickLeaveType = await TimeOffType.create({
    name: 'Sick & Medical Leave',
    code: 'SICK_LEAVE',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Paid medical leave for health recovery'
  });

  const unpaidLeaveType = await TimeOffType.create({
    name: 'Unpaid Leave of Absence',
    code: 'UNPAID_LEAVE',
    unit: 'days',
    allocationRequired: false,
    approvalRequired: true,
    isPaid: false,
    description: 'Unpaid leave beyond allocated quota'
  });

  // Allocations for all employees
  const currentYearStart = new Date('2026-01-01');
  const currentYearEnd = new Date('2026-12-31');

  const employeesList = [emp1, emp2, emp3, emp4];
  for (const emp of employeesList) {
    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: paidLeaveType._id,
      allocatedAmount: 20,
      takenAmount: emp.employeeId === 'EMP-001' ? 2 : 0,
      remainingAmount: emp.employeeId === 'EMP-001' ? 18 : 20,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved'
    });

    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: sickLeaveType._id,
      allocatedAmount: 10,
      takenAmount: 0,
      remainingAmount: 10,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved'
    });
  }

  // Approved Leave for Alex Turner
  await TimeOffRequest.create({
    employee: emp1._id,
    timeOffType: paidLeaveType._id,
    startDate: new Date('2026-08-10'),
    endDate: new Date('2026-08-11'),
    duration: 2,
    status: 'Approved',
    reason: 'Family summer vacation',
    approvedBy: hrManagerUser._id,
    approvedAt: new Date('2026-08-05')
  });

  // Pending Leave for Sarah Jenkins
  await TimeOffRequest.create({
    employee: emp2._id,
    timeOffType: paidLeaveType._id,
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-09-18'),
    duration: 4,
    status: 'Pending',
    reason: 'Attending product leadership summit'
  });

  console.log('[Seeder] 8. Creating Attendance Records...');
  const baseDate = new Date('2026-08-01');
  for (let d = 1; d <= 20; d++) {
    const logDate = new Date(baseDate);
    logDate.setDate(d);
    const dayOfWeek = logDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const checkInTime = new Date(logDate);
    checkInTime.setHours(9, 0, 0);

    const checkOutTime = new Date(logDate);
    checkOutTime.setHours(17, 30, 0);

    for (const emp of employeesList) {
      await Attendance.create({
        employee: emp._id,
        date: logDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workedHours: 7.5,
        status: d === 5 ? 'Late' : 'Present'
      });
    }
  }

  console.log('[Seeder] 9. Creating Finalized Historical Payrun (August 2026)...');
  const augPeriodStart = new Date('2026-08-01');
  const augPeriodEnd = new Date('2026-08-31');

  const augPayrun = new Payrun({
    name: 'August 2026 Regular Company Payrun',
    salaryStructure: standardStructure._id,
    periodStart: augPeriodStart,
    periodEnd: augPeriodEnd,
    selectedEmployees: employeesList.map((e) => e._id),
    status: 'Paid',
    createdBy: payrollManagerUser._id,
    finalizedAt: new Date('2026-08-31T18:00:00Z'),
    paidAt: new Date('2026-08-31T18:30:00Z')
  });
  await augPayrun.save();

  // Generate payslips for August payrun
  const payslipIds = [];
  let totalB = 0, totalA = 0, totalG = 0, totalD = 0, totalN = 0;

  for (const emp of employeesList) {
    const contract = await Contract.findOne({ employee: emp._id, status: 'Active' });
    const calc = await calculateSalary({
      employee: emp,
      contract,
      salaryStructure: standardStructure,
      payrollPeriod: { start: augPeriodStart, end: augPeriodEnd },
      workingSchedule: standardSchedule
    });

    const payslip = await Payslip.create({
      employee: emp._id,
      payrun: augPayrun._id,
      contract: contract._id,
      salaryStructure: standardStructure._id,
      payrollPeriod: { start: augPeriodStart, end: augPeriodEnd },
      metrics: calc.metrics,
      basic: calc.basic,
      allowances: calc.allowances,
      gross: calc.gross,
      deductions: calc.deductions,
      net: calc.net,
      ruleBreakdown: calc.ruleBreakdown,
      status: 'Paid'
    });

    payslipIds.push(payslip._id);
    totalB += calc.basic;
    totalA += calc.allowances;
    totalG += calc.gross;
    totalD += calc.deductions;
    totalN += calc.net;
  }

  augPayrun.payslips = payslipIds;
  augPayrun.totals = {
    totalBasic: totalB,
    totalAllowances: totalA,
    totalGross: totalG,
    totalDeductions: totalD,
    totalNet: totalN,
    employeeCount: payslipIds.length
  };
  await augPayrun.save();

  console.log('[Seeder] 10. Creating Draft Payrun (September 2026)...');
  const septPeriodStart = new Date('2026-09-01');
  const septPeriodEnd = new Date('2026-09-30');

  const septPayrun = await Payrun.create({
    name: 'September 2026 Regular Company Payrun',
    salaryStructure: standardStructure._id,
    periodStart: septPeriodStart,
    periodEnd: septPeriodEnd,
    selectedEmployees: [emp1._id, emp2._id, emp3._id, emp4._id],
    status: 'Draft',
    createdBy: payrollUser._id
  });

  console.log('====================================================');
  console.log(' SEEDING COMPLETED SUCCESSFULLY! ');
  console.log('====================================================');
  console.log('Demo Logins (Password for all: Password@123)');
  console.log('1. Admin:                 admin@peoplepay360.com');
  console.log('2. HR Manager:            hrmanager@peoplepay360.com');
  console.log('3. HR Payroll User:       payrolluser@peoplepay360.com');
  console.log('4. HR Payroll Manager:    payrollmgr@peoplepay360.com');
  console.log('5. Employee:              alex.turner@peoplepay360.com');
  console.log('====================================================');
};

module.exports = {
  seedDatabase
};
