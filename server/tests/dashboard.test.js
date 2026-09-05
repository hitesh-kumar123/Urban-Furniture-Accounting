require('./setup');
const Employee = require('../src/models/Employee');
const Attendance = require('../src/models/Attendance');
const TimeOffRequest = require('../src/models/TimeOffRequest');
const TimeOffType = require('../src/models/TimeOffType');
const Payslip = require('../src/models/Payslip');
const { getPayrollDashboardMetrics } = require('../src/services/dashboardService');
const mongoose = require('mongoose');

describe('6. Live Database Dashboard & Reporting Engine Tests', () => {
  it('should calculate live aggregation metrics for headcount, payroll, attendance, and leave', async () => {
    // 1. Setup Employees across departments
    const empEng = await Employee.create({
      employeeId: 'EMP-ENG',
      firstName: 'Eng',
      lastName: 'One',
      email: 'eng1@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Dev',
      joiningDate: new Date('2024-01-01'),
      bankAccount: { accountNumber: '111222' }
    });

    const empSales = await Employee.create({
      employeeId: 'EMP-SALES',
      firstName: 'Sales',
      lastName: 'One',
      email: 'sales1@peoplepay360.com',
      department: 'Sales',
      jobPosition: 'Rep',
      joiningDate: new Date('2024-01-01'),
      bankAccount: { accountNumber: '333444' }
    });

    // 2. Setup Attendance logs
    await Attendance.create({
      employee: empEng._id,
      date: new Date('2026-09-02'),
      workedHours: 8,
      status: 'Present'
    });
    await Attendance.create({
      employee: empSales._id,
      date: new Date('2026-09-02'),
      workedHours: 7,
      status: 'Late'
    });

    // 3. Setup Leave Request
    const leaveType = await TimeOffType.create({
      name: 'Test Leave',
      code: 'TL_01'
    });
    await TimeOffRequest.create({
      employee: empEng._id,
      timeOffType: leaveType._id,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-12'),
      duration: 3,
      status: 'Approved'
    });

    // 4. Setup Payslips
    const dummyPayrunId = new mongoose.Types.ObjectId();
    const dummyStructureId = new mongoose.Types.ObjectId();
    const dummyContractId = new mongoose.Types.ObjectId();

    await Payslip.create({
      employee: empEng._id,
      payrun: dummyPayrunId,
      contract: dummyContractId,
      salaryStructure: dummyStructureId,
      payrollPeriod: { start: new Date('2026-09-01'), end: new Date('2026-09-30') },
      basic: 5000,
      allowances: 1000,
      gross: 6000,
      deductions: 600,
      net: 5400,
      status: 'Paid'
    });

    await Payslip.create({
      employee: empSales._id,
      payrun: dummyPayrunId,
      contract: dummyContractId,
      salaryStructure: dummyStructureId,
      payrollPeriod: { start: new Date('2026-09-01'), end: new Date('2026-09-30') },
      basic: 4000,
      allowances: 500,
      gross: 4500,
      deductions: 450,
      net: 4050,
      status: 'Paid'
    });

    // Run live aggregation
    const metrics = await getPayrollDashboardMetrics({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30'
    });

    // Verify headcount
    expect(metrics.headcount.total).toBe(2);
    expect(metrics.headcount.byDepartment.Engineering).toBe(1);
    expect(metrics.headcount.byDepartment.Sales).toBe(1);

    // Verify financial aggregations (5400 + 4050 = 9450 net paid)
    expect(metrics.payroll.totalNetPaid).toBe(9450);
    expect(metrics.payroll.totalGross).toBe(10500);
    expect(metrics.payroll.payslipsGenerated).toBe(2);
    expect(metrics.payroll.averageSalary).toBe(4725);

    // Verify attendance summary
    expect(metrics.attendance.present).toBe(1);
    expect(metrics.attendance.late).toBe(1);
    expect(metrics.attendance.totalWorkedHours).toBe(15);

    // Verify leave summary
    expect(metrics.leave.approved).toBe(1);
    expect(metrics.leave.approvedDays).toBe(3);
  });
});
