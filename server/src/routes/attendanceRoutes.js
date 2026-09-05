const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.post('/punch', attendanceController.togglePunch);
router.get('/', attendanceController.getAttendance);
router.get('/:id', attendanceController.getAttendanceById);

router.post(
  '/',
  validate(schemas.createAttendance),
  attendanceController.createAttendance
);

router.put(
  '/:id',
  validate(schemas.updateAttendance),
  attendanceController.updateAttendance
);

router.delete(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll Manager', 'Admin'),
  attendanceController.deleteAttendance
);

module.exports = router;
