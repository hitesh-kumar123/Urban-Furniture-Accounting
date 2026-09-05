require('./setup');
const { WorkingSchedule } = require('../src/models/WorkingSchedule');
const Employee = require('../src/models/Employee');
const Contract = require('../src/models/Contract');
const SalaryStructure = require('../src/models/SalaryStructure');
const { calculateWeeklyHours } = require('../src/services/scheduleService');
const { getApplicableContract, validateNoOverlappingContract } = require('../src/services/contractService');

describe('2. Working Schedule & Contract Management Tests', () => {
  it('should automatically calculate total weekly hours from schedule days', async () => {
    // 5 days x 8 hours worked (9:00 to 18:00 with 60min break = 8.0 hours/day = 40h/week)
    const schedule = new WorkingSchedule({
      name: 'Standard 40h',
      days: [
        { day: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { day: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
      ]
    });

    await schedule.save();

    expect(schedule.totalWeeklyHours).toBe(40);
    expect(calculateWeeklyHours(schedule)).toBe(40);
  });

  it('should select the period-specific contract (historical vs current)', async () => {
    const employee = await Employee.create({
      employeeId: 'EMP-100',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@peoplepay360.com',
      department: 'Engineering',
      jobPosition: 'Developer',
      joiningDate: new Date('2022-01-01')
    });

    const structure = await SalaryStructure.create({
      name: 'Test Structure',
      code: 'TEST_STR',
      rules: []
    });

    // 1. Historical Contract: Jan 2023 - Dec 2023 ($5,000/mo)
    const historicalContract = await Contract.create({
      employee: employee._id,
      name: 'Contract 2023',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      wage: 5000,
      salaryStructure: structure._id,
      status: 'Expired'
    });

    // 2. Current Active Contract: Jan 2024 - Ongoing ($7,500/mo)
    const currentContract = await Contract.create({
      employee: employee._id,
      name: 'Contract 2024+',
      startDate: new Date('2024-01-01'),
      endDate: null,
      wage: 7500,
      salaryStructure: structure._id,
      status: 'Active'
    });

    // Case A: Query payroll period in 2023 (August 2023)
    const applicable2023 = await getApplicableContract(employee._id, {
      start: '2023-08-01',
      end: '2023-08-31'
    });
    expect(applicable2023).toBeDefined();
    expect(applicable2023._id.toString()).toBe(historicalContract._id.toString());
    expect(applicable2023.wage).toBe(5000);

    // Case B: Query payroll period in 2026 (September 2026)
    const applicable2026 = await getApplicableContract(employee._id, {
      start: '2026-09-01',
      end: '2026-09-30'
    });
    expect(applicable2026).toBeDefined();
    expect(applicable2026._id.toString()).toBe(currentContract._id.toString());
    expect(applicable2026.wage).toBe(7500);
  });

  it('should detect and prevent concurrent active contract conflicts', async () => {
    const employee = await Employee.create({
      employeeId: 'EMP-101',
      firstName: 'Alice',
      lastName: 'Wonder',
      email: 'alice@peoplepay360.com',
      department: 'Finance',
      jobPosition: 'Analyst',
      joiningDate: new Date('2024-01-01')
    });

    const structure = await SalaryStructure.create({
      name: 'Test Structure 2',
      code: 'TEST_STR2',
      rules: []
    });

    // First active contract: Jan 2024 to Dec 2024
    await Contract.create({
      employee: employee._id,
      name: 'Contract 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      wage: 4000,
      salaryStructure: structure._id,
      status: 'Active'
    });

    // Trying to create an overlapping contract (June 2024 to May 2025) should fail
    await expect(
      validateNoOverlappingContract(employee._id, new Date('2024-06-01'), new Date('2025-05-31'))
    ).rejects.toThrow('Concurrent active contract conflict detected');
  });
});
