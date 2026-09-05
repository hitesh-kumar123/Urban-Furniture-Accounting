const { calculateDayHours } = require('../models/WorkingSchedule');

/**
 * Calculates total weekly hours from schedule days.
 * 
 * @param {Object} schedule - WorkingSchedule document or object containing days array
 * @returns {number}
 */
const calculateWeeklyHours = (schedule) => {
  if (!schedule || !schedule.days || !Array.isArray(schedule.days)) {
    return 0;
  }
  const total = schedule.days.reduce((acc, day) => acc + calculateDayHours(day), 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates expected working hours for an employee between two dates based on their working schedule.
 * 
 * @param {Object} schedule - WorkingSchedule document
 * @param {Date | string} startDate 
 * @param {Date | string} endDate 
 * @returns {{ expectedHours: number, expectedDays: number }}
 */
const getExpectedScheduleHours = (schedule, startDate, endDate) => {
  if (!schedule || !schedule.days || schedule.days.length === 0) {
    return { expectedHours: 0, expectedDays: 0 };
  }

  const s = new Date(startDate);
  const e = new Date(endDate);

  const dayMap = {};
  schedule.days.forEach((d) => {
    dayMap[d.day] = d;
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let expectedHours = 0;
  let expectedDays = 0;

  const current = new Date(s);
  while (current <= e) {
    const dayName = dayNames[current.getDay()];
    const shift = dayMap[dayName];
    if (shift && shift.isWorkingDay) {
      expectedDays += 1;
      expectedHours += calculateDayHours(shift);
    }
    current.setDate(current.getDate() + 1);
  }

  return {
    expectedHours: Math.round((expectedHours + Number.EPSILON) * 100) / 100,
    expectedDays
  };
};

module.exports = {
  calculateWeeklyHours,
  getExpectedScheduleHours
};
