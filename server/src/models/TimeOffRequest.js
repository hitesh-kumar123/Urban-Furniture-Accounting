const mongoose = require('mongoose');

const timeOffRequestSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0.5, 'Duration must be at least 0.5']
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Refused', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    reason: {
      type: String,
      default: ''
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

timeOffRequestSchema.index({ employee: 1, startDate: 1, endDate: 1, status: 1 });

const TimeOffRequest = mongoose.model('TimeOffRequest', timeOffRequestSchema);

module.exports = TimeOffRequest;
