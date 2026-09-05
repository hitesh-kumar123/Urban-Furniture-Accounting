const mongoose = require('mongoose');

const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Time off type name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Time off type code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    unit: {
      type: String,
      enum: ['days', 'hours'],
      default: 'days'
    },
    allocationRequired: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    isPaid: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

const TimeOffType = mongoose.model('TimeOffType', timeOffTypeSchema);

module.exports = TimeOffType;
