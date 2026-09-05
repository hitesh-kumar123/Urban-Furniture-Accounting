const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getScheduleById);

router.post(
  '/',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.createSchedule),
  scheduleController.createSchedule
);

router.put(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.updateSchedule),
  scheduleController.updateSchedule
);

router.delete(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll Manager', 'Admin'),
  scheduleController.deleteSchedule
);

module.exports = router;
