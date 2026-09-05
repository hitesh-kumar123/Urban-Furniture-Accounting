require('./setup');
const Employee = require('../src/models/Employee');
const Contract = require('../src/models/Contract');
const SalaryRule = require('../src/models/SalaryRule');
const SalaryStructure = require('../src/models/SalaryStructure');
const Payrun = require('../src/models/Payrun');
const Payslip = require('../src/models/Payslip');
const User = require('../src/models/User');
const {
  getEligibleEmployees,
  computePayrun,
  validatePayrun,
  markPayrunPaid
} = require('../src/services/payrunService');

describe('5. Payrun Processing & Duplicate Payslip Protection Tests', () => {
  let employee1, employee2, structure, adminUser;

  beforeEach(async () => {
    const hash = await User.hashPassword('Password@123');
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin_test@peoplepay360.com',
      passwordHash: hash,
      role: 'Admin'
    });

    const ruleBasic = await SalaryRule.create({
      name: 'Basic Pay',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      calculationType: 'Formula',
      formula: 'CONTRACT_WAGE * 0.60'
    });

    const ruleGross = await SalaryRule.create({
      name: 'Gross Pay',
      code: 'GROSS',
      category: 'Gross',
      sequence: 20,
      calculationType: 'Formula',
      formula: 'BASIC'
    });

    const ruleNet = await SalaryRule.create({
      name: 'Net Pay',
      code: 'NET',
      category: 'Net',
      sequence: 30,
      calculationType: 'Formula',
      formula: 'GROSS'
    });

    structure = await SalaryStructure.create({
      name: 'Basic Structure',
      code: 'BASIC_STR',
      rules: [ruleBasic._id, ruleGross._id, ruleNet._id]
    });

    employee1 = await Employee.create({
      employeeId: 'EMP-01',
      firstName: 'Adam',
      lastName: 'Driver',
      email: 'adam@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Engineer',
      joiningDate: new Date('2024-01-01'),
      bankAccount: { accountNumber: '123456789' }
    });

    employee2 = await Employee.create({
      employeeId: 'EMP-02',
      firstName: 'Ben',
      lastName: 'Affleck',
      email: 'ben@peoplepay360.com',
      department: 'Sales',
      jobPosition: 'Director',
      joiningDate: new Date('2024-01-01'),
      bankAccount: { accountNumber: '987654321' }
    });

    await Contract.create({
      employee: employee1._id,
      name: 'Adam Contract',
      startDate: new Date('2024-01-01'),
      wage: 6000,
      salaryStructure: structure._id,
      status: 'Active'
    });

    await Contract.create({
      employee: employee2._id,
      name: 'Ben Contract',
      startDate: new Date('2024-01-01'),
      wage: 8000,
      salaryStructure: structure._id,
      status: 'Active'
    });
  });

  it('should find eligible employees with active contracts in period', async () => {
    const eligible = await getEligibleEmployees(structure._id, '2026-09-01', '2026-09-30');
    expect(eligible.length).toBe(2);
    expect(eligible.map((e) => e.employee.employeeId)).toContain('EMP-01');
    expect(eligible.map((e) => e.employee.employeeId)).toContain('EMP-02');
  });

  it('should compute payrun, generate payslips, validate and mark as paid', async () => {
    // 1. Create Payrun
    const payrun = await Payrun.create({
      name: 'September 2026 Payrun',
      salaryStructure: structure._id,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      selectedEmployees: [employee1._id, employee2._id],
      status: 'Draft',
      createdBy: adminUser._id
    });

    // 2. Compute Payrun
    const computed = await computePayrun(payrun._id);
    expect(computed.status).toBe('Computed');
    expect(computed.payslips.length).toBe(2);
    expect(computed.totals.employeeCount).toBe(2);
    // Adam: Basic = 6000 * 0.6 = 3600. Ben: Basic = 8000 * 0.6 = 4800. Total = 8400
    expect(computed.totals.totalBasic).toBe(8400);
    expect(computed.totals.totalNet).toBe(8400);

    // Verify Payslips in DB
    const payslips = await Payslip.find({ payrun: payrun._id });
    expect(payslips.length).toBe(2);
    expect(payslips[0].status).toBe('Draft');

    // 3. Validate Payrun
    const validated = await validatePayrun(payrun._id);
    expect(validated.status).toBe('Validated');
    expect(validated.finalizedAt).toBeDefined();

    const validatedPayslips = await Payslip.find({ payrun: payrun._id });
    expect(validatedPayslips[0].status).toBe('Validated');

    // 4. Mark Paid
    const paidPayrun = await markPayrunPaid(payrun._id);
    expect(paidPayrun.status).toBe('Paid');
    expect(paidPayrun.paidAt).toBeDefined();

    const paidPayslips = await Payslip.find({ payrun: payrun._id });
    expect(paidPayslips[0].status).toBe('Paid');
  });

  it('should detect duplicate payslip warning when same employee has payslip for the same period in another payrun', async () => {
    // 1. Create and compute first Payrun
    const payrun1 = await Payrun.create({
      name: 'Batch 1 Payrun',
      salaryStructure: structure._id,
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      selectedEmployees: [employee1._id],
      status: 'Draft',
      createdBy: adminUser._id
    });
    await computePayrun(payrun1._id);

    // 2. Create second Payrun containing same employee for overlapping period
    const payrun2 = await Payrun.create({
      name: 'Batch 2 Payrun (Duplicate Attempt)',
      salaryStructure: structure._id,
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      selectedEmployees: [employee1._id],
      status: 'Draft',
      createdBy: adminUser._id
    });

    const computed2 = await computePayrun(payrun2._id);
    expect(computed2.warnings.length).toBeGreaterThan(0);
    expect(computed2.warnings[0].message).toContain('Duplicate payslip warning');
  });
});
