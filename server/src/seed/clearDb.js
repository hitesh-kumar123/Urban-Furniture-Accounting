const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
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

const clearAndInitializeProductionDB = async () => {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('🧹 [PURGE] Purging all dummy accounts & mock records...');
    console.log('======================================================\n');

    // 1. Delete all existing records
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

    console.log('✓ All dummy accounts, mock employees, test payslips & payruns purged.');

    // 2. Setup standard Working Schedules (Indian Standard Work Hours)
    console.log('\n⚙️ [INIT] Setting up standard Indian Enterprise schedules...');
    const standardDays = [
      { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '18:00', breakMinutes: 0 },
      { day: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '18:00', breakMinutes: 0 }
    ];

    const standardSchedule = await WorkingSchedule.create({
      name: 'Standard 40-Hour Work Week (Mon-Fri)',
      description: 'Monday to Friday, 9:00 AM to 6:00 PM (1-hour lunch break)',
      days: standardDays
    });

    // 3. Setup standard Leave / Time-Off Types
    console.log('⚙️ [INIT] Setting up Indian Statutory Leave types...');
    await TimeOffType.insertMany([
      { name: 'Earned / Privilege Leave (PL)', code: 'PL', isPaid: true, requiresApproval: true, color: '#10B981' },
      { name: 'Casual Leave (CL)', code: 'CL', isPaid: true, requiresApproval: true, color: '#3B82F6' },
      { name: 'Sick Leave (SL)', code: 'SL', isPaid: true, requiresApproval: true, color: '#F59E0B' },
      { name: 'Maternity Leave (ML)', code: 'ML', isPaid: true, requiresApproval: true, color: '#EC4899' },
      { name: 'Loss of Pay / Unpaid Leave (LOP)', code: 'LOP', isPaid: false, requiresApproval: true, color: '#EF4444' }
    ]);

    // 4. Setup Indian Statutory Salary Rules
    console.log('⚙️ [INIT] Setting up Indian Payroll Statutory Rules (INR)...');
    const ruleBasic = await SalaryRule.create({
      name: 'Basic Pay',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      calculationType: 'Formula',
      formula: 'CONTRACT_WAGE * 0.50',
      description: '50% of Monthly CTC Base Wage'
    });

    const ruleHRA = await SalaryRule.create({
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
      fixedAmount: 2000,
      description: 'Monthly special & performance allowance'
    });

    const ruleGross = await SalaryRule.create({
      name: 'Gross Salary',
      code: 'GROSS',
      category: 'Gross',
      sequence: 40,
      calculationType: 'Formula',
      formula: 'BASIC + HRA + SPECIAL_ALLOWANCE',
      description: 'Total Gross Earnings'
    });

    const rulePF = await SalaryRule.create({
      name: 'Provident Fund (PF)',
      code: 'PF',
      category: 'Deductions',
      sequence: 50,
      calculationType: 'Percentage',
      percentage: 12,
      percentageBaseRuleCode: 'BASIC',
      description: '12% of Basic Pay towards EPFO'
    });

    const rulePT = await SalaryRule.create({
      name: 'Professional Tax (PT)',
      code: 'PRO_TAX',
      category: 'Deductions',
      sequence: 60,
      calculationType: 'Fixed',
      fixedAmount: 200,
      description: 'Standard State Professional Tax Rs. 200/month'
    });

    const ruleNet = await SalaryRule.create({
      name: 'Net Salary',
      code: 'NET',
      category: 'Net',
      sequence: 100,
      calculationType: 'Formula',
      formula: 'GROSS - (PF + PRO_TAX)',
      description: 'Net Take Home Pay'
    });

    await SalaryStructure.create({
      name: 'Standard Indian CTC Structure',
      code: 'STD_INR_CTC',
      description: 'Statutory Compliant Indian Payroll Structure (Basic 50%, HRA 40% of Basic, Special Allowance, PF 12%, PT Rs. 200)',
      rules: [
        ruleBasic._id,
        ruleHRA._id,
        ruleSpecial._id,
        ruleGross._id,
        rulePF._id,
        rulePT._id,
        ruleNet._id
      ]
    });

    // 5. Create 1 Clean Super Admin Account
    console.log('👤 [INIT] Creating initial Administrator Account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    await User.create({
      name: 'System Administrator',
      email: 'admin@peoplepay360.com',
      passwordHash,
      role: 'Admin',
      status: 'Active'
    });

    console.log('\n======================================================');
    console.log('✅ DATABASE INITIALIZED & CLEANED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Initial Super Admin Credentials:');
    console.log('  Email:    admin@peoplepay360.com');
    console.log('  Password: Password@123');
    console.log('  Role:     Admin');
    console.log('\nZero dummy employees, contracts, payruns, or mock data.');
    console.log('You can now add real company employees and process real payroll.\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ [Database Init Error]:', err);
    process.exit(1);
  }
};

clearAndInitializeProductionDB();
