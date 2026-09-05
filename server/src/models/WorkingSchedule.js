const mongoose = require('mongoose');

const scheduleDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    isWorkingDay: {
      type: Boolean,
      default: true
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00'
    },
    endTime: {
      type: String,
      required: true,
      default: '17:00'
    },
    breakMinutes: {
      type: Number,
      default: 60,
      min: 0
    }
  },
  { _id: false }
);

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Schedule name is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      default: ''
    },
    days: {
      type: [scheduleDaySchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A schedule must have at least one day defined'
      }
    },
    totalWeeklyHours: {
      type: Number,
      default: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const calculateDayHours = (day) => {
  if (!day || !day.isWorkingDay || !day.startTime || !day.endTime) return 0;
  try {
    const [startH, startM] = (day.startTime || '09:00').split(':').map(Number);
    const [endH, endM] = (day.endTime || '17:00').split(':').map(Number);
    const startTotalMinutes = (startH || 0) * 60 + (startM || 0);
    const endTotalMinutes = (endH || 0) * 60 + (endM || 0);

    let workMinutes = endTotalMinutes - startTotalMinutes - (day.breakMinutes || 0);
    if (workMinutes < 0) workMinutes = 0;
    return workMinutes / 60;
  } catch (e) {
    return 0;
  }
};

// Pre-save hook to calculate totalWeeklyHours automatically
workingScheduleSchema.pre('save', function (next) {
  if (this.days && this.days.length > 0) {
    const total = this.days.reduce((acc, day) => acc + calculateDayHours(day), 0);
    this.totalWeeklyHours = Math.round((total + Number.EPSILON) * 100) / 100;
  }
  next();
});

const WorkingSchedule = mongoose.model('WorkingSchedule', workingScheduleSchema);

module.exports = {
  WorkingSchedule,
  calculateDayHours
};
