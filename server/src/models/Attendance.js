const mongoose = require('mongoose');

const punchIntervalSchema = new mongoose.Schema(
  {
    in: { type: Date, required: true },
    out: { type: Date, default: null },
    durationHours: { type: Number, default: 0 },
    type: { type: String, enum: ['Regular', 'Break', 'ClientVisit'], default: 'Regular' }
  },
  { _id: false }
);

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
    punches: {
      type: [punchIntervalSchema],
      default: []
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

// Pre-save hook to calculate workedHours across all punch intervals or single checkIn/checkOut
attendanceSchema.pre('save', function (next) {
  if (Array.isArray(this.punches) && this.punches.length > 0) {
    let totalDuration = 0;
    this.punches.forEach((p) => {
      if (p.in && p.out) {
        const ms = new Date(p.out).getTime() - new Date(p.in).getTime();
        if (ms > 0) {
          const h = ms / (1000 * 60 * 60);
          p.durationHours = Math.round((h + Number.EPSILON) * 100) / 100;
          totalDuration += p.durationHours;
        }
      }
    });

    this.workedHours = Math.round((totalDuration + Number.EPSILON) * 100) / 100;

    // First check-in
    if (!this.checkIn && this.punches[0]?.in) {
      this.checkIn = this.punches[0].in;
    }
    // Latest check-out
    const lastPunch = this.punches[this.punches.length - 1];
    if (lastPunch && lastPunch.out) {
      this.checkOut = lastPunch.out;
    } else {
      this.checkOut = null;
    }
  } else if (this.checkIn && this.checkOut) {
    const diffMs = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    if (diffMs > 0) {
      const calculatedHours = diffMs / (1000 * 60 * 60);
      this.workedHours = Math.round((calculatedHours + Number.EPSILON) * 100) / 100;
    }
  }

  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
