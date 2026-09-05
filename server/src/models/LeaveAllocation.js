const mongoose = require('mongoose');

const leaveAllocationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    timeOffType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: [true, 'Time off type is required'],
      index: true
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated amount is required'],
      min: [0, 'Allocated amount cannot be negative']
    },
    takenAmount: {
      type: Number,
      default: 0,
      min: [0, 'Taken amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.allocatedAmount || 0;
      }
    },
    validityStart: {
      type: Date,
      required: [true, 'Validity start date is required'],
      index: true
    },
    validityEnd: {
      type: Date,
      required: [true, 'Validity end date is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Cancelled'],
      default: 'Approved',
      index: true
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to ensure remainingAmount consistency
leaveAllocationSchema.pre('save', function (next) {
  this.remainingAmount = Math.max(0, (this.allocatedAmount || 0) - (this.takenAmount || 0));
  next();
});

const LeaveAllocation = mongoose.model('LeaveAllocation', leaveAllocationSchema);

module.exports = LeaveAllocation;
