const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true
    },
    jobPosition: {
      type: String,
      required: [true, 'Job position is required'],
      trim: true,
      index: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    workingSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null
    },
    employeeStatus: {
      type: String,
      enum: ['Active', 'Probation', 'Suspended', 'Terminated'],
      default: 'Active',
      index: true
    },
    employeeType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contractor', 'Intern'],
      default: 'Full-Time',
      index: true
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required']
    },
    terminationDate: {
      type: Date,
      default: null
    },
    bankAccount: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscOrRouting: { type: String, default: '' },
      accountHolderName: { type: String, default: '' }
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
