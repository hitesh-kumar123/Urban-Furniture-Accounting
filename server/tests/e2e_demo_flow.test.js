require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const { WorkingSchedule } = require('../src/models/WorkingSchedule');
const SalaryRule = require('../src/models/SalaryRule');
const SalaryStructure = require('../src/models/SalaryStructure');
const Contract = require('../src/models/Contract');
const Attendance = require('../src/models/Attendance');
const TimeOffType = require('../src/models/TimeOffType');
const LeaveAllocation = require('../src/models/LeaveAllocation');

describe('7. Complete End-to-End Scenario Verification', () => {
  let adminToken, hrManagerToken, payrollManagerToken, employeeToken;
  let employeeDoc, standardStructure;

  beforeEach(async () => {
    const hash = await User.hashPassword('Password@123');

    // Admin
    await User.create({
      name: 'System Admin',
      email: 'admin@peoplepay360.com',
      passwordHash: hash,
      role: 'Admin'
    });
    const aLogin = await request(app).post('/api/auth/login').send({ email: 'admin@peoplepay360.com', password: 'Password@123' });
    adminToken = aLogin.body.data.token;

    // HR Manager
    await User.create({
      name: 'HR Manager',
      email: 'hrmgr@peoplepay360.com',
      passwordHash: hash,
      role: 'HR Manager'
    });
    const hLogin = await request(app).post('/api/auth/login').send({ email: 'hrmgr@peoplepay360.com', password: 'Password@123' });
    hrManagerToken = hLogin.body.data.token;

    // HR Payroll Manager
    await User.create({
      name: 'Payroll Manager',
      email: 'payrollmgr@peoplepay360.com',
      passwordHash: hash,
      role: 'HR Payroll Manager'
    });
    const pLogin = await request(app).post('/api/auth/login').send({ email: 'payrollmgr@peoplepay360.com', password: 'Password@123' });
    payrollManagerToken = pLogin.body.data.token;

    // 1. Working Schedule
    const schedule = new WorkingSchedule({
      name: 'Standard 40h',
      days: [
        { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
        { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
        { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
        { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 0 },
        { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 0 }
      ]
    });
    await schedule.save();

    // 2. Employee
    employeeDoc = await Employee.create({
      employeeId: 'EMP-999',
      firstName: 'Tony',
      lastName: 'Stark',
      email: 'tony@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Principal Architect',
      workingSchedule: schedule._id,
      joiningDate: new Date('2023-01-01'),
      bankAccount: {
        bankName: 'Stark Bank',
        accountNumber: '999888777'
      }
    });

    const empUser = await User.create({
      name: 'Tony Stark',
      email: 'tony@peoplepay360.com',
      passwordHash: hash,
      role: 'Employee',
      employee: employeeDoc._id
    });
    const eLogin = await request(app).post('/api/auth/login').send({ email: 'tony@peoplepay360.com', password: 'Password@123' });
    employeeToken = eLogin.body.data.token;

    // 3. Salary Rules & Structure
    const rBasic = await SalaryRule.create({
      name: 'Basic Pay',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      calculationType: 'Formula',
      formula: 'CONTRACT_WAGE * 0.50'
    });

    const rHra = await SalaryRule.create({
      name: 'HRA Allowance',
      code: 'HRA',
      category: 'Allowances',
      sequence: 20,
      calculationType: 'Percentage',
      percentage: 40,
      percentageBaseRuleCode: 'BASIC'
    });

    const rPf = await SalaryRule.create({
      name: 'Provident Fund',
      code: 'PF',
      category: 'Deductions',
      sequence: 30,
      calculationType: 'Percentage',
      percentage: 12,
      percentageBaseRuleCode: 'BASIC'
    });

    const rNet = await SalaryRule.create({
      name: 'Net Salary',
      code: 'NET',
      category: 'Net',
      sequence: 100,
      calculationType: 'Formula',
      formula: 'GROSS - DEDUCTIONS'
    });

    standardStructure = await SalaryStructure.create({
      name: 'Executive Structure',
      code: 'EXEC_01',
      rules: [rBasic._id, rHra._id, rPf._id, rNet._id]
    });

    // 4. Contract for Employee ($10,000 / month)
    await Contract.create({
      employee: employeeDoc._id,
      name: 'Tony Stark Active Contract',
      startDate: new Date('2024-01-01'),
      endDate: null,
      wage: 10000,
      salaryStructure: standardStructure._id,
      workingSchedule: schedule._id,
      status: 'Active'
    });

    // 5. Attendance entries
    await Attendance.create({
      employee: employeeDoc._id,
      date: new Date('2026-09-01'),
      workedHours: 8,
      status: 'Present'
    });
  });

  it('Scenario 1: Complete Payroll Processing & PDF Generation Flow', async () => {
    // 1. Step 1 & 2: Create Payrun for September 2026
    const createRes = await request(app)
      .post('/api/payruns')
      .set('Authorization', `Bearer ${payrollManagerToken}`)
      .send({
        name: 'September 2026 Payroll Batch',
        salaryStructure: standardStructure._id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        selectedEmployees: [employeeDoc._id]
      });

    expect(createRes.status).toBe(201);
    const payrunId = createRes.body.data._id;

    // 2. Compute Payrun
    const computeRes = await request(app)
      .post(`/api/payruns/${payrunId}/compute`)
      .set('Authorization', `Bearer ${payrollManagerToken}`);

    expect(computeRes.status).toBe(200);
    expect(computeRes.body.data.status).toBe('Computed');
    expect(computeRes.body.data.totals.totalBasic).toBe(5000); // 10000 * 0.5 = 5000
    expect(computeRes.body.data.totals.totalAllowances).toBe(2000); // 40% of 5000 = 2000
    expect(computeRes.body.data.totals.totalGross).toBe(7000); // 5000 + 2000 = 7000
    expect(computeRes.body.data.totals.totalDeductions).toBe(600); // 12% of 5000 = 600
    expect(computeRes.body.data.totals.totalNet).toBe(6400); // 7000 - 600 = 6400

    // 3. Validate Payrun
    const valRes = await request(app)
      .post(`/api/payruns/${payrunId}/validate`)
      .set('Authorization', `Bearer ${payrollManagerToken}`);

    expect(valRes.status).toBe(200);
    expect(valRes.body.data.status).toBe('Validated');

    // 4. Mark Payrun Paid
    const payRes = await request(app)
      .post(`/api/payruns/${payrunId}/mark-paid`)
      .set('Authorization', `Bearer ${payrollManagerToken}`);

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('Paid');

    // 5. Employee accesses their own payslip & generates PDF
    const payslipsRes = await request(app)
      .get('/api/payslips')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(payslipsRes.status).toBe(200);
    expect(payslipsRes.body.data.length).toBe(1);
    const payslipId = payslipsRes.body.data[0]._id;

    // Download PDF
    const pdfRes = await request(app)
      .get(`/api/payslips/${payslipId}/pdf`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(500); // Real PDF binary buffer

    // 6. Live Dashboard reflects payroll expenditure
    const dashRes = await request(app)
      .get('/api/dashboard/payroll?periodStart=2026-09-01&periodEnd=2026-09-30')
      .set('Authorization', `Bearer ${payrollManagerToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.payroll.totalNetPaid).toBe(6400);
    expect(dashRes.body.data.headcount.total).toBe(1);
  });

  it('Scenario 2: Leave Allocation, Request Creation & Auto Balance Deduction Flow', async () => {
    // 1. Create Time Off Type
    const leaveType = await TimeOffType.create({
      name: 'Paid Casual Off',
      code: 'CASUAL_OFF',
      unit: 'days',
      allocationRequired: true,
      approvalRequired: true,
      isPaid: true
    });

    // 2. HR creates Leave Allocation (10 days)
    const allocRes = await request(app)
      .post('/api/time-off/allocations')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee: employeeDoc._id,
        timeOffType: leaveType._id,
        allocatedAmount: 10,
        validityStart: '2026-01-01',
        validityEnd: '2026-12-31'
      });

    expect(allocRes.status).toBe(201);
    expect(allocRes.body.data.remainingAmount).toBe(10);

    // 3. Employee requests 3 days off
    const reqRes = await request(app)
      .post('/api/time-off/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employee: employeeDoc._id,
        timeOffType: leaveType._id,
        startDate: '2026-09-15',
        endDate: '2026-09-17',
        duration: 3,
        reason: 'Personal time'
      });

    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.data._id;
    expect(reqRes.body.data.status).toBe('Pending');

    // 4. HR Manager approves request
    const approveRes = await request(app)
      .post(`/api/time-off/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('Approved');

    // 5. Check leave balance via API
    const balRes = await request(app)
      .get(`/api/time-off/balance?employeeId=${employeeDoc._id}&timeOffTypeId=${leaveType._id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(balRes.status).toBe(200);
    expect(balRes.body.data.allocated).toBe(10);
    expect(balRes.body.data.taken).toBe(3);
    expect(balRes.body.data.remaining).toBe(7);
  });
});
