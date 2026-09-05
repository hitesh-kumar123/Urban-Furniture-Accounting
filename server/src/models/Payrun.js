const mongoose = require('mongoose');

const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payrun name is required'],
      trim: true
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary Structure is required']
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
      index: true
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
      index: true
    },
    selectedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
      }
    ],
    status: {
      type: String,
      enum: ['Draft', 'Computed', 'Validated', 'Paid', 'PayslipsSent', 'Cancelled'],
      default: 'Draft',
      index: true
    },
    payslips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payslip'
      }
    ],
    warnings: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        message: { type: String, required: true },
        level: { type: String, enum: ['Warning', 'Critical'], default: 'Warning' }
      }
    ],
    totals: {
      totalBasic: { type: Number, default: 0 },
      totalAllowances: { type: Number, default: 0 },
      totalGross: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      totalNet: { type: Number, default: 0 },
      employeeCount: { type: Number, default: 0 }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    finalizedAt: {
      type: Date,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    emailsSentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

payrunSchema.index({ periodStart: 1, periodEnd: 1, status: 1 });

const Payrun = mongoose.model('Payrun', payrunSchema);

module.exports = Payrun;
