const mongoose = require('mongoose');

const ruleBreakdownSchema = new mongoose.Schema(
  {
    rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryRule',
      required: true
    },
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Basic', 'Allowances', 'Gross', 'Deductions', 'Net'],
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    calculationType: {
      type: String,
      enum: ['Fixed', 'Percentage', 'Formula'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    formulaOrBase: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
      index: true
    },
    payrun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: [true, 'Payrun is required'],
      index: true
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: [true, 'Contract is required']
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary Structure is required']
    },
    payrollPeriod: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    metrics: {
      workedDays: { type: Number, default: 0 },
      workedHours: { type: Number, default: 0 },
      totalScheduleHours: { type: Number, default: 0 },
      approvedLeaveDays: { type: Number, default: 0 }
    },
    basic: {
      type: Number,
      required: true,
      default: 0
    },
    allowances: {
      type: Number,
      required: true,
      default: 0
    },
    gross: {
      type: Number,
      required: true,
      default: 0
    },
    deductions: {
      type: Number,
      required: true,
      default: 0
    },
    net: {
      type: Number,
      required: true,
      default: 0
    },
    ruleBreakdown: [ruleBreakdownSchema],
    status: {
      type: String,
      enum: ['Draft', 'Validated', 'Paid', 'Cancelled'],
      default: 'Draft',
      index: true
    },
    warnings: [
      {
        type: String
      }
    ],
    emailStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed'],
      default: 'Pending'
    },
    emailSentAt: {
      type: Date,
      default: null
    },
    emailError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active payslips for same employee & payroll period
payslipSchema.index(
  { employee: 1, 'payrollPeriod.start': 1, 'payrollPeriod.end': 1 },
  { unique: true }
);

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = Payslip;
