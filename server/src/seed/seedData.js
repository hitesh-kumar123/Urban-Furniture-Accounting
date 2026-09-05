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
    { day: 'Monday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Tuesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Wednesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Thursday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Friday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
    { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
  ];

  const standardSchedule = await WorkingSchedule.create({
    name: 'Standard Corporate 40-Hour Week',
    description: 'Monday to Friday, 9:30 AM to 6:30 PM with 1-hour lunch break',
    days: standardDays
  });

  const flexibleSchedule = await WorkingSchedule.create({
    name: 'Flexible Engineering 35-Hour Shift',
    description: 'Monday to Friday 10:00 AM to 6:00 PM with 1-hour break',
    days: [
      { day: 'Monday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Tuesday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Wednesday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Thursday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Friday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
      { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
    ]
  });

  const operationsSchedule = await WorkingSchedule.create({
    name: 'Support & Ops 44-Hour Week',
    description: 'Mon-Fri full day + Saturday half day',
    days: [
      { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Saturday', isWorkingDay: true, startTime: '09:30', endTime: '13:30', breakMinutes: 0 },
      { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
    ]
  });

  console.log('[Seeder] 2. Creating Employees across departments...');
  const emp1 = await Employee.create({
    employeeId: 'EMP-001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma@peoplepay360.com',
    phone: '+91 98201 11223',
    department: 'Engineering',
    jobPosition: 'Lead Software Architect',
    workingSchedule: flexibleSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2022-04-01'),
    bankAccount: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50100234567891',
      ifscOrRouting: 'HDFC0001234',
      accountHolderName: 'Aarav Sharma'
    },
    address: {
      street: '402 Cyber Heights, Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560103',
      country: 'India'
    }
  });

  const emp2 = await Employee.create({
    employeeId: 'EMP-002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@peoplepay360.com',
    phone: '+91 98202 22334',
    department: 'Engineering',
    jobPosition: 'Senior Backend Engineer',
    workingSchedule: standardSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-01-15'),
    bankAccount: {
      bankName: 'ICICI Bank',
      accountNumber: '001105001234',
      ifscOrRouting: 'ICIC0000011',
      accountHolderName: 'Priya Patel'
    },
    address: {
      street: 'B-12 Lotus Towers, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400051',
      country: 'India'
    }
  });

  const emp3 = await Employee.create({
    employeeId: 'EMP-003',
    firstName: 'Rohan',
    lastName: 'Mehta',
    email: 'rohan.mehta@peoplepay360.com',
    phone: '+91 98203 33445',
    department: 'Product',
    jobPosition: 'Principal Product Manager',
    workingSchedule: standardSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2022-09-01'),
    bankAccount: {
      bankName: 'State Bank of India',
      accountNumber: '30987654321',
      ifscOrRouting: 'SBIN0004567',
      accountHolderName: 'Rohan Mehta'
    },
    address: {
      street: 'Flat 6A Silver Crest, Sector 44',
      city: 'Gurugram',
      state: 'Haryana',
      zipCode: '122003',
      country: 'India'
    }
  });

  const emp4 = await Employee.create({
    employeeId: 'EMP-004',
    firstName: 'Ananya',
    lastName: 'Sen',
    email: 'ananya.sen@peoplepay360.com',
    phone: '+91 98204 44556',
    department: 'Marketing',
    jobPosition: 'Growth & Brand Marketing Lead',
    workingSchedule: standardSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-06-10'),
    bankAccount: {
      bankName: 'Axis Bank',
      accountNumber: '918020012345678',
      ifscOrRouting: 'UTIB0000890',
      accountHolderName: 'Ananya Sen'
    },
    address: {
      street: '22 Park Street, 3rd Floor',
      city: 'Kolkata',
      state: 'West Bengal',
      zipCode: '700016',
      country: 'India'
    }
  });

  const emp5 = await Employee.create({
    employeeId: 'EMP-005',
    firstName: 'Vikram',
    lastName: 'Malhotra',
    email: 'vikram.malhotra@peoplepay360.com',
    phone: '+91 98205 55667',
    department: 'Design',
    jobPosition: 'Lead UI/UX Designer',
    workingSchedule: flexibleSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-03-20'),
    bankAccount: {
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '4512345678',
      ifscOrRouting: 'KKBK0000123',
      accountHolderName: 'Vikram Malhotra'
    },
    address: {
      street: 'Plot 88 Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500033',
      country: 'India'
    }
  });

  const emp6 = await Employee.create({
    employeeId: 'EMP-006',
    firstName: 'Neha',
    lastName: 'Reddy',
    email: 'neha.reddy@peoplepay360.com',
    phone: '+91 98206 66778',
    department: 'Human Resources',
    jobPosition: 'Senior HR Business Partner',
    workingSchedule: operationsSchedule._id,
    employeeStatus: 'Active',
    employeeType: 'Full-Time',
    joiningDate: new Date('2023-08-01'),
    bankAccount: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50100987654321',
      ifscOrRouting: 'HDFC0001234',
      accountHolderName: 'Neha Reddy'
    },
    address: {
      street: '15 Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      country: 'India'
    }
  });

  const allEmployees = [emp1, emp2, emp3, emp4, emp5, emp6];

  console.log('[Seeder] 3. Creating Users for all 5 RBAC roles...');
  const commonPassword = 'Password@123';
  const hashedCommon = await User.hashPassword(commonPassword);

  const adminUser = await User.create({
    name: 'Rajesh Singhania (Admin)',
    email: 'admin@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Admin',
    status: 'Active'
  });

  const hrManagerUser = await User.create({
    name: 'Neha Reddy (HR Manager)',
    email: 'hrmanager@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Manager',
    employee: emp6._id,
    status: 'Active'
  });
  await Employee.findByIdAndUpdate(emp6._id, { user: hrManagerUser._id });

  const payrollUser = await User.create({
    name: 'Kavita Iyer (Payroll User)',
    email: 'payrolluser@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll User',
    status: 'Active'
  });

  const payrollManagerUser = await User.create({
    name: 'Sunil Narang (Payroll Head)',
    email: 'payrollmgr@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'HR Payroll Manager',
    status: 'Active'
  });

  const employeeUser = await User.create({
    name: 'Aarav Sharma (Employee)',
    email: 'alex.turner@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Employee',
    employee: emp1._id,
    status: 'Active'
  });

  const employeeUser2 = await User.create({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@peoplepay360.com',
    passwordHash: hashedCommon,
    role: 'Employee',
    employee: emp1._id,
    status: 'Active'
  });
  await Employee.findByIdAndUpdate(emp1._id, { user: employeeUser._id });

  console.log('[Seeder] 4. Creating Salary Rules...');
  const ruleBasic = await SalaryRule.create({
    name: 'Basic Pay',
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
    description: '40% of Basic Pay towards residential accommodation'
  });

  const ruleSpecial = await SalaryRule.create({
    name: 'Special Allowance',
    code: 'SPECIAL_ALLOWANCE',
    category: 'Allowances',
    sequence: 30,
    calculationType: 'Fixed',
    fixedAmount: 5000,
    description: 'Monthly utility, conveyance & performance allowance'
  });

  const ruleMedical = await SalaryRule.create({
    name: 'Medical & Health Allowance',
    code: 'MED_ALLOWANCE',
    category: 'Allowances',
    sequence: 35,
    calculationType: 'Fixed',
    fixedAmount: 1500,
    description: 'Monthly statutory medical reimbursement component'
  });

  const ruleGross = await SalaryRule.create({
    name: 'Gross Earnings',
    code: 'GROSS',
    category: 'Gross',
    sequence: 40,
    calculationType: 'Formula',
    formula: 'BASIC + HRA + SPECIAL_ALLOWANCE + MED_ALLOWANCE',
    description: 'Total Gross Earnings before statutory deductions'
  });

  const rulePf = await SalaryRule.create({
    name: 'Provident Fund (EPF)',
    code: 'PF',
    category: 'Deductions',
    sequence: 50,
    calculationType: 'Percentage',
    percentage: 12,
    percentageBaseRuleCode: 'BASIC',
    description: '12% of Basic Pay towards employee retirement fund'
  });

  const ruleTax = await SalaryRule.create({
    name: 'Professional Tax (PT)',
    code: 'PRO_TAX',
    category: 'Deductions',
    sequence: 60,
    calculationType: 'Fixed',
    fixedAmount: 200,
    description: 'State statutory professional tax'
  });

  const ruleTds = await SalaryRule.create({
    name: 'Income Tax (TDS)',
    code: 'TDS',
    category: 'Deductions',
    sequence: 70,
    calculationType: 'Formula',
    formula: 'GROSS * 0.08',
    description: '8% Income Tax TDS deduction on Gross earnings'
  });

  const ruleNet = await SalaryRule.create({
    name: 'Net Take-Home Salary',
    code: 'NET',
    category: 'Net',
    sequence: 100,
    calculationType: 'Formula',
    formula: 'GROSS - DEDUCTIONS',
    description: 'Final Take-home salary credited to bank account'
  });

  console.log('[Seeder] 5. Creating Salary Structures...');
  const standardStructure = await SalaryStructure.create({
    name: 'Standard Indian Corporate Salary Structure',
    code: 'IND_CORP_2026',
    description: 'Comprehensive monthly salary package compliant with Indian statutory rules (EPF, PT, TDS, HRA)',
    rules: [
      ruleBasic._id,
      ruleHra._id,
      ruleSpecial._id,
      ruleMedical._id,
      ruleGross._id,
      rulePf._id,
      ruleTax._id,
      ruleTds._id,
      ruleNet._id
    ]
  });

  console.log('[Seeder] 6. Creating Contracts (Current & Historical with INR Wages)...');
  // Historical contract for Aarav Sharma (2022-2023 at ₹1,10,000/mo)
  await Contract.create({
    employee: emp1._id,
    name: 'Aarav Sharma - Senior Software Engineer 2022',
    startDate: new Date('2022-04-01'),
    endDate: new Date('2023-12-31'),
    wage: 110000,
    department: 'Engineering',
    jobPosition: 'Senior Software Engineer',
    salaryStructure: standardStructure._id,
    workingSchedule: flexibleSchedule._id,
    status: 'Expired',
    terms: 'Initial senior engineering employment terms'
  });

  // Active Running Contracts for ALL 6 Employees
  const contracts = [
    { emp: emp1, name: 'Aarav Sharma - Lead Architect Agreement', wage: 145000, pos: 'Lead Software Architect', dept: 'Engineering', sched: flexibleSchedule._id },
    { emp: emp2, name: 'Priya Patel - Senior Backend Contract', wage: 95000, pos: 'Senior Backend Engineer', dept: 'Engineering', sched: standardSchedule._id },
    { emp: emp3, name: 'Rohan Mehta - Principal PM Agreement', wage: 120000, pos: 'Principal Product Manager', dept: 'Product', sched: standardSchedule._id },
    { emp: emp4, name: 'Ananya Sen - Marketing Lead Agreement', wage: 75000, pos: 'Growth & Brand Marketing Lead', dept: 'Marketing', sched: standardSchedule._id },
    { emp: emp5, name: 'Vikram Malhotra - Design Lead Contract', wage: 85000, pos: 'Lead UI/UX Designer', dept: 'Design', sched: flexibleSchedule._id },
    { emp: emp6, name: 'Neha Reddy - HR Partner Contract', wage: 65000, pos: 'Senior HR Business Partner', dept: 'Human Resources', sched: operationsSchedule._id }
  ];

  for (const c of contracts) {
    await Contract.create({
      employee: c.emp._id,
      name: c.name,
      startDate: new Date('2024-01-01'),
      endDate: null,
      wage: c.wage,
      department: c.dept,
      jobPosition: c.pos,
      salaryStructure: standardStructure._id,
      workingSchedule: c.sched,
      status: 'Active',
      terms: 'Permanent full-time employment agreement'
    });
  }

  console.log('[Seeder] 7. Creating Time Off Types, Allocations & Requests...');
  const plType = await TimeOffType.create({
    name: 'Privilege / Annual Leave (PL)',
    code: 'PL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Statutory paid annual vacation leaves'
  });

  const clType = await TimeOffType.create({
    name: 'Casual Leave (CL)',
    code: 'CL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Casual personal leaves for unplanned errands'
  });

  const slType = await TimeOffType.create({
    name: 'Sick & Medical Leave (SL)',
    code: 'SL',
    unit: 'days',
    allocationRequired: true,
    approvalRequired: true,
    isPaid: true,
    description: 'Paid medical leave for health recovery'
  });

  const unpaidType = await TimeOffType.create({
    name: 'Leave Without Pay (LWP)',
    code: 'LWP',
    unit: 'days',
    allocationRequired: false,
    approvalRequired: true,
    isPaid: false,
    description: 'Unpaid personal leaves'
  });

  // Annual Allocations for ALL employees
  const currentYearStart = new Date('2026-01-01');
  const currentYearEnd = new Date('2026-12-31');

  for (const emp of allEmployees) {
    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: plType._id,
      allocatedAmount: 18,
      takenAmount: emp.employeeId === 'EMP-001' ? 3 : 0,
      remainingAmount: emp.employeeId === 'EMP-001' ? 15 : 18,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved',
      remarks: 'Annual 2026 Privilege Leave Quota'
    });

    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: clType._id,
      allocatedAmount: 12,
      takenAmount: emp.employeeId === 'EMP-002' ? 1 : 0,
      remainingAmount: emp.employeeId === 'EMP-002' ? 11 : 12,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved',
      remarks: 'Annual 2026 Casual Leave Quota'
    });

    await LeaveAllocation.create({
      employee: emp._id,
      timeOffType: slType._id,
      allocatedAmount: 10,
      takenAmount: 0,
      remainingAmount: 10,
      validityStart: currentYearStart,
      validityEnd: currentYearEnd,
      status: 'Approved',
      remarks: 'Annual 2026 Sick Leave Quota'
    });
  }

  // Approved Leave for Aarav Sharma
  await TimeOffRequest.create({
    employee: emp1._id,
    timeOffType: plType._id,
    startDate: new Date('2026-08-12'),
    endDate: new Date('2026-08-14'),
    duration: 3,
    status: 'Approved',
    reason: 'Family wedding ceremony in Jaipur',
    approvedBy: hrManagerUser._id,
    approvedAt: new Date('2026-08-08')
  });

  // Pending Leave for Priya Patel
  await TimeOffRequest.create({
    employee: emp2._id,
    timeOffType: clType._id,
    startDate: new Date('2026-09-18'),
    endDate: new Date('2026-09-19'),
    duration: 2,
    status: 'Pending',
    reason: 'Personal home relocation and banking work'
  });

  // Pending Leave for Rohan Mehta
  await TimeOffRequest.create({
    employee: emp3._id,
    timeOffType: plType._id,
    startDate: new Date('2026-09-24'),
    endDate: new Date('2026-09-26'),
    duration: 3,
    status: 'Pending',
    reason: 'Attending Product Leaders Conclave in Goa'
  });

  // Refused Request with Justification Reason
  await TimeOffRequest.create({
    employee: emp4._id,
    timeOffType: plType._id,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-08-28'),
    duration: 4,
    status: 'Refused',
    reason: 'Festival holiday extension',
    approvedBy: hrManagerUser._id,
    approvedAt: new Date('2026-08-20'),
    rejectionReason: 'Overlapping sprint release deadline with full team attendance required'
  });

  console.log('[Seeder] 8. Creating Attendance Records for current and past months...');
  const dates = [
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
    '2026-08-10', '2026-08-11', '2026-08-17', '2026-08-18', '2026-08-19',
    '2026-08-20', '2026-08-21', '2026-08-24', '2026-08-25', '2026-08-26',
    '2026-08-27', '2026-08-28', '2026-08-31', '2026-09-01', '2026-09-02',
    '2026-09-03', '2026-09-04', '2026-09-05'
  ];

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    for (const emp of allEmployees) {
      const inTime = new Date(d);
      inTime.setHours(9, 30, 0);

      const outTime = new Date(d);
      outTime.setHours(18, 30, 0);

      const isLate = (d.getDate() % 7 === 0);
      if (isLate) inTime.setHours(10, 15, 0);

      await Attendance.create({
        employee: emp._id,
        date: d,
        checkIn: inTime,
        checkOut: outTime,
        workedHours: isLate ? 7.25 : 8.0,
        status: isLate ? 'Late' : 'Present'
      });
    }
  }

  console.log('[Seeder] 9. Creating Finalized Payruns & Certified Payslips (July & August 2026)...');
  
  // Helper to generate a payrun batch
  const createBatch = async (name, start, end, status, finalizeDate) => {
    const payrun = new Payrun({
      name,
      salaryStructure: standardStructure._id,
      periodStart: start,
      periodEnd: end,
      selectedEmployees: allEmployees.map((e) => e._id),
      status,
      createdBy: payrollManagerUser._id,
      finalizedAt: finalizeDate,
      paidAt: finalizeDate
    });
    await payrun.save();

    const payslipIds = [];
    let totalB = 0, totalA = 0, totalG = 0, totalD = 0, totalN = 0;

    for (const emp of allEmployees) {
      const contract = await Contract.findOne({ employee: emp._id, status: 'Active' });
      const calc = await calculateSalary({
        employee: emp,
        contract,
        salaryStructure: standardStructure,
        payrollPeriod: { start, end },
        workingSchedule: standardSchedule
      });

      const payslip = await Payslip.create({
        employee: emp._id,
        payrun: payrun._id,
        contract: contract._id,
        salaryStructure: standardStructure._id,
        payrollPeriod: { start, end },
        metrics: calc.metrics,
        basic: calc.basic,
        allowances: calc.allowances,
        gross: calc.gross,
        deductions: calc.deductions,
        net: calc.net,
        ruleBreakdown: calc.ruleBreakdown,
        status: status === 'Paid' ? 'Paid' : 'Draft'
      });

      payslipIds.push(payslip._id);
      totalB += calc.basic;
      totalA += calc.allowances;
      totalG += calc.gross;
      totalD += calc.deductions;
      totalN += calc.net;
    }

    payrun.payslips = payslipIds;
    payrun.totals = {
      totalBasic: totalB,
      totalAllowances: totalA,
      totalGross: totalG,
      totalDeductions: totalD,
      totalNet: totalN,
      employeeCount: payslipIds.length
    };
    await payrun.save();
    return payrun;
  };

  // July 2026 Batch (Settled)
  await createBatch(
    'July 2026 Corporate Pay Cycle',
    new Date('2026-07-01'),
    new Date('2026-07-31'),
    'Paid',
    new Date('2026-07-31T18:30:00Z')
  );

  // August 2026 Batch (Settled)
  await createBatch(
    'August 2026 Corporate Pay Cycle',
    new Date('2026-08-01'),
    new Date('2026-08-31'),
    'Paid',
    new Date('2026-08-31T18:30:00Z')
  );

  // September 2026 Batch (Draft / Ready to Compute & Review)
  const septPayrun = await Payrun.create({
    name: 'September 2026 Corporate Pay Cycle',
    salaryStructure: standardStructure._id,
    periodStart: new Date('2026-09-01'),
    periodEnd: new Date('2026-09-30'),
    selectedEmployees: allEmployees.map((e) => e._id),
    status: 'Draft',
    createdBy: payrollUser._id
  });

  console.log('====================================================');
  console.log(' SEEDING COMPLETED SUCCESSFULLY WITH 100% RICH DATA!');
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
