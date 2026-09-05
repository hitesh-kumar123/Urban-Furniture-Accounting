const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true
    },
    checkIn: {
      type: Date,
      default: null
    },
    checkOut: {
      type: Date,
      default: null
    },
    workedHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent', 'Overtime', 'Missing Check-out', 'Half Day'],
      default: 'Present',
      index: true
    },
    isManualCorrection: {
      type: Boolean,
      default: false
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

// Compound index for uniqueness per employee per date (normalized to YYYY-MM-DD)
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Pre-save hook to calculate workedHours if checkIn and checkOut exist and not manually overridden
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    if (diffMs > 0) {
      const calculatedHours = diffMs / (1000 * 60 * 60);
      this.workedHours = Math.round((calculatedHours + Number.EPSILON) * 100) / 100;
    }
  } else if (this.checkIn && !this.checkOut && !this.isManualCorrection) {
    this.status = 'Missing Check-out';
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
