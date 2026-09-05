const Joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const customObjectId = Joi.string().pattern(objectIdRegex).message('Invalid ObjectId format');

const schemas = {
  // Auth
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin').default('Employee'),
    employee: customObjectId.optional().allow(null)
  }),

  login: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  }),

  // Employee
  createEmployee: Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().allow('', null).optional(),
    employeeId: Joi.string().trim().required(),
    department: Joi.string().trim().required(),
    jobPosition: Joi.string().trim().required(),
    manager: customObjectId.optional().allow(null),
    workingSchedule: customObjectId.optional().allow(null),
    employeeStatus: Joi.string().valid('Active', 'Probation', 'Suspended', 'Terminated').default('Active'),
    employeeType: Joi.string().valid('Full-Time', 'Part-Time', 'Contractor', 'Intern').default('Full-Time'),
    joiningDate: Joi.date().iso().required(),
    terminationDate: Joi.date().iso().allow(null).optional(),
    bankAccount: Joi.object({
      bankName: Joi.string().trim().allow('', null),
      accountNumber: Joi.string().trim().allow('', null),
      ifscOrRouting: Joi.string().trim().allow('', null),
      accountHolderName: Joi.string().trim().allow('', null)
    }).optional(),
    address: Joi.object({
      street: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
      zipCode: Joi.string().allow('', null),
      country: Joi.string().allow('', null)
    }).optional()
  }),

  updateEmployee: Joi.object({
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    email: Joi.string().trim().email().optional(),
    phone: Joi.string().trim().allow('', null).optional(),
    employeeId: Joi.string().trim().optional(),
    department: Joi.string().trim().optional(),
    jobPosition: Joi.string().trim().optional(),
    manager: customObjectId.optional().allow(null),
    workingSchedule: customObjectId.optional().allow(null),
    employeeStatus: Joi.string().valid('Active', 'Probation', 'Suspended', 'Terminated').optional(),
    employeeType: Joi.string().valid('Full-Time', 'Part-Time', 'Contractor', 'Intern').optional(),
    joiningDate: Joi.date().iso().optional(),
    terminationDate: Joi.date().iso().allow(null).optional(),
    bankAccount: Joi.object({
      bankName: Joi.string().trim().allow('', null),
      accountNumber: Joi.string().trim().allow('', null),
      ifscOrRouting: Joi.string().trim().allow('', null),
      accountHolderName: Joi.string().trim().allow('', null)
    }).optional(),
    address: Joi.object({
      street: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
      zipCode: Joi.string().allow('', null),
      country: Joi.string().allow('', null)
    }).optional()
  }),

  // Contract
  createContract: Joi.object({
    employee: customObjectId.required(),
    name: Joi.string().trim().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().allow(null, '').optional(),
    wage: Joi.number().min(0).required(),
    department: Joi.string().trim().allow('', null).optional(),
    jobPosition: Joi.string().trim().allow('', null).optional(),
    salaryStructure: customObjectId.required(),
    workingSchedule: customObjectId.allow(null, '').optional(),
    status: Joi.string().valid('Draft', 'Active', 'Expired', 'Terminated').default('Active'),
    state: Joi.string().valid('Draft', 'Active', 'Expired', 'Terminated').optional(),
    terms: Joi.string().allow('', null).optional()
  }),

  updateContract: Joi.object({
    employee: customObjectId.optional(),
    name: Joi.string().trim().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().allow(null, '').optional(),
    wage: Joi.number().min(0).optional(),
    department: Joi.string().trim().allow('', null).optional(),
    jobPosition: Joi.string().trim().allow('', null).optional(),
    salaryStructure: customObjectId.optional(),
    workingSchedule: customObjectId.allow(null, '').optional(),
    status: Joi.string().valid('Draft', 'Active', 'Expired', 'Terminated').optional(),
    state: Joi.string().valid('Draft', 'Active', 'Expired', 'Terminated').optional(),
    terms: Joi.string().allow('', null).optional()
  }),

  // Working Schedule
  createSchedule: Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().allow('', null).optional(),
    days: Joi.array().items(
      Joi.object({
        day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
        isWorkingDay: Joi.boolean().default(true),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        breakMinutes: Joi.number().min(0).max(300).default(0)
      })
    ).min(1).required()
  }),

  updateSchedule: Joi.object({
    name: Joi.string().trim().optional(),
    description: Joi.string().allow('', null).optional(),
    days: Joi.array().items(
      Joi.object({
        day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
        isWorkingDay: Joi.boolean().default(true),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        breakMinutes: Joi.number().min(0).max(300).default(0)
      })
    ).min(1).optional()
  }),

  // Attendance
  createAttendance: Joi.object({
    employee: customObjectId.required(),
    date: Joi.date().iso().required(),
    checkIn: Joi.date().iso().allow(null).optional(),
    checkOut: Joi.date().iso().allow(null).optional(),
    workedHours: Joi.number().min(0).max(24).optional(),
    status: Joi.string().valid('Present', 'Late', 'Absent', 'Overtime', 'Missing Check-out', 'Half Day').optional(),
    remarks: Joi.string().allow('', null).optional(),
    isManualCorrection: Joi.boolean().default(false)
  }),

  updateAttendance: Joi.object({
    checkIn: Joi.date().iso().allow(null).optional(),
    checkOut: Joi.date().iso().allow(null).optional(),
    workedHours: Joi.number().min(0).max(24).optional(),
    status: Joi.string().valid('Present', 'Late', 'Absent', 'Overtime', 'Missing Check-out', 'Half Day').optional(),
    remarks: Joi.string().allow('', null).optional(),
    isManualCorrection: Joi.boolean().default(true)
  }),

  // Time Off Type
  createTimeOffType: Joi.object({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().uppercase().required(),
    unit: Joi.string().valid('days', 'hours').default('days'),
    allocationRequired: Joi.boolean().default(true),
    approvalRequired: Joi.boolean().default(true),
    isPaid: Joi.boolean().default(true),
    description: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('Active', 'Inactive').default('Active')
  }),

  updateTimeOffType: Joi.object({
    name: Joi.string().trim().optional(),
    code: Joi.string().trim().uppercase().optional(),
    unit: Joi.string().valid('days', 'hours').optional(),
    allocationRequired: Joi.boolean().optional(),
    approvalRequired: Joi.boolean().optional(),
    isPaid: Joi.boolean().optional(),
    description: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('Active', 'Inactive').optional()
  }),

  // Leave Allocation
  createLeaveAllocation: Joi.object({
    employee: customObjectId.required(),
    timeOffType: customObjectId.required(),
    allocatedAmount: Joi.number().positive().required(),
    validityStart: Joi.date().iso().required(),
    validityEnd: Joi.date().iso().greater(Joi.ref('validityStart')).required(),
    status: Joi.string().valid('Draft', 'Approved', 'Cancelled').default('Approved'),
    remarks: Joi.string().allow('', null).optional()
  }),

  updateLeaveAllocation: Joi.object({
    allocatedAmount: Joi.number().positive().optional(),
    validityStart: Joi.date().iso().optional(),
    validityEnd: Joi.date().iso().optional(),
    status: Joi.string().valid('Draft', 'Approved', 'Cancelled').optional(),
    remarks: Joi.string().allow('', null).optional()
  }),

  // Time Off Request
  createTimeOffRequest: Joi.object({
    employee: customObjectId.required(),
    timeOffType: customObjectId.required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    duration: Joi.number().positive().optional(),
    reason: Joi.string().allow('', null).optional()
  }),

  refuseTimeOffRequest: Joi.object({
    rejectionReason: Joi.string().trim().required()
  }),

  // Salary Rule
  createSalaryRule: Joi.object({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().uppercase().required(),
    category: Joi.string().valid('Basic', 'Allowances', 'Gross', 'Deductions', 'Net').required(),
    sequence: Joi.number().integer().min(1).required(),
    calculationType: Joi.string().valid('Fixed', 'Percentage', 'Formula').required(),
    fixedAmount: Joi.number().min(0).when('calculationType', { is: 'Fixed', then: Joi.required() }),
    percentage: Joi.number().min(0).max(100).when('calculationType', { is: 'Percentage', then: Joi.required() }),
    percentageBaseRuleCode: Joi.string().trim().uppercase().when('calculationType', { is: 'Percentage', then: Joi.optional() }),
    formula: Joi.string().trim().when('calculationType', { is: 'Formula', then: Joi.required() }),
    description: Joi.string().allow('', null).optional(),
    active: Joi.boolean().default(true)
  }),

  updateSalaryRule: Joi.object({
    name: Joi.string().trim().optional(),
    code: Joi.string().trim().uppercase().optional(),
    category: Joi.string().valid('Basic', 'Allowances', 'Gross', 'Deductions', 'Net').optional(),
    sequence: Joi.number().integer().min(1).optional(),
    calculationType: Joi.string().valid('Fixed', 'Percentage', 'Formula').optional(),
    fixedAmount: Joi.number().min(0).optional(),
    percentage: Joi.number().min(0).max(100).optional(),
    percentageBaseRuleCode: Joi.string().trim().uppercase().optional(),
    formula: Joi.string().trim().optional(),
    description: Joi.string().allow('', null).optional(),
    active: Joi.boolean().optional()
  }),

  // Salary Structure
  createSalaryStructure: Joi.object({
    name: Joi.string().trim().required(),
    code: Joi.string().trim().uppercase().required(),
    description: Joi.string().allow('', null).optional(),
    rules: Joi.array().items(customObjectId).min(1).required(),
    active: Joi.boolean().default(true)
  }),

  updateSalaryStructure: Joi.object({
    name: Joi.string().trim().optional(),
    code: Joi.string().trim().uppercase().optional(),
    description: Joi.string().allow('', null).optional(),
    rules: Joi.array().items(customObjectId).min(1).optional(),
    active: Joi.boolean().optional()
  }),

  // Payrun
  createPayrun: Joi.object({
    name: Joi.string().trim().required(),
    salaryStructure: customObjectId.required(),
    periodStart: Joi.date().iso().required(),
    periodEnd: Joi.date().iso().greater(Joi.ref('periodStart')).required(),
    selectedEmployees: Joi.array().items(customObjectId).min(1).required()
  }),

  updatePayrun: Joi.object({
    name: Joi.string().trim().optional(),
    selectedEmployees: Joi.array().items(customObjectId).min(1).optional()
  })
};

module.exports = {
  schemas,
  customObjectId
};
