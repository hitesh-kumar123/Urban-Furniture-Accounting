require('./setup');
const SalaryRule = require('../src/models/SalaryRule');
const SalaryStructure = require('../src/models/SalaryStructure');
const { calculateSalary } = require('../src/services/salaryEngine');

describe('4. Dynamic Salary Rule Engine & Sequencing Tests', () => {
  it('should execute salary rules in strict sequence and evaluate Fixed, Percentage, and Formula calculations', async () => {
    // 1. Create Rules in jumbled sequence to test automatic sorting
    const rTds = await SalaryRule.create({
      name: 'TDS (10% on Gross)',
      code: 'TDS',
      category: 'Deductions',
      sequence: 70,
      calculationType: 'Formula',
      formula: 'GROSS * 0.10'
    });

    const rBasic = await SalaryRule.create({
      name: 'Basic Pay (50% of Wage)',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      calculationType: 'Formula',
      formula: 'CONTRACT_WAGE * 0.50'
    });

    const rHra = await SalaryRule.create({
      name: 'House Rent Allowance (50% of Basic)',
      code: 'HRA',
      category: 'Allowances',
      sequence: 20,
      calculationType: 'Percentage',
      percentage: 50,
      percentageBaseRuleCode: 'BASIC'
    });

    const rSpecial = await SalaryRule.create({
      name: 'Special Allowance (Fixed $1000)',
      code: 'SPECIAL_ALLOWANCE',
      category: 'Allowances',
      sequence: 30,
      calculationType: 'Fixed',
      fixedAmount: 1000
    });

    const rPf = await SalaryRule.create({
      name: 'Provident Fund (12% of Basic)',
      code: 'PF',
      category: 'Deductions',
      sequence: 50,
      calculationType: 'Percentage',
      percentage: 12,
      percentageBaseRuleCode: 'BASIC'
    });

    // Structure with jumbled array
    const structure = await SalaryStructure.create({
      name: 'Test Engineering Structure',
      code: 'ENG_STRUCT',
      rules: [rTds._id, rHra._id, rBasic._id, rPf._id, rSpecial._id]
    });

    // Contract wage = $10,000
    const mockContract = {
      wage: 10000
    };

    const result = await calculateSalary({
      employee: { firstName: 'Test', lastName: 'User' },
      contract: mockContract,
      salaryStructure: structure,
      payrollPeriod: { start: '2026-09-01', end: '2026-09-30' }
    });

    // Calculation expected breakdown:
    // BASIC = 10000 * 0.50 = 5000
    // HRA = 50% of 5000 = 2500
    // SPECIAL = Fixed 1000
    // Basic Total = 5000
    // Allowances Total = 2500 + 1000 = 3500
    // GROSS = 5000 + 3500 = 8500
    // PF = 12% of 5000 = 600
    // TDS = 10% of GROSS (8500) = 850
    // Deductions Total = 600 + 850 = 1450
    // NET = 8500 - 1450 = 7050

    expect(result.basic).toBe(5000);
    expect(result.allowances).toBe(3500);
    expect(result.gross).toBe(8500);
    expect(result.deductions).toBe(1450);
    expect(result.net).toBe(7050);

    // Verify sequenced rule breakdown array
    expect(result.ruleBreakdown.length).toBe(5);
    expect(result.ruleBreakdown[0].code).toBe('BASIC');
    expect(result.ruleBreakdown[0].amount).toBe(5000);
    expect(result.ruleBreakdown[1].code).toBe('HRA');
    expect(result.ruleBreakdown[1].amount).toBe(2500);
    expect(result.ruleBreakdown[2].code).toBe('SPECIAL_ALLOWANCE');
    expect(result.ruleBreakdown[2].amount).toBe(1000);
    expect(result.ruleBreakdown[3].code).toBe('PF');
    expect(result.ruleBreakdown[3].amount).toBe(600);
    expect(result.ruleBreakdown[4].code).toBe('TDS');
    expect(result.ruleBreakdown[4].amount).toBe(850);
  });
});
