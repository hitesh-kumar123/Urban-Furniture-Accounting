const mongoose = require('mongoose');

const salaryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Rule code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: ['Basic', 'Allowances', 'Gross', 'Deductions', 'Net'],
      required: [true, 'Rule category is required'],
      index: true
    },
    sequence: {
      type: Number,
      required: [true, 'Execution sequence is required'],
      min: 1,
      index: true
    },
    calculationType: {
      type: String,
      enum: ['Fixed', 'Percentage', 'Formula'],
      required: [true, 'Calculation type is required']
    },
    fixedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    percentageBaseRuleCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: 'BASIC'
    },
    formula: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const SalaryRule = mongoose.model('SalaryRule', salaryRuleSchema);

module.exports = SalaryRule;
