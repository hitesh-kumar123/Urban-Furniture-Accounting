const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Contract name/reference is required'],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Contract start date is required'],
      index: true
    },
    endDate: {
      type: Date,
      default: null,
      index: true
    },
    wage: {
      type: Number,
      required: [true, 'Wage / Base salary is required'],
      min: [0, 'Wage cannot be negative']
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    jobPosition: {
      type: String,
      trim: true,
      default: ''
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary Structure reference is required']
    },
    workingSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Expired', 'Terminated'],
      default: 'Active',
      index: true
    },
    terms: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying employee contracts by start and end dates
contractSchema.index({ employee: 1, startDate: 1, endDate: 1, status: 1 });

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
