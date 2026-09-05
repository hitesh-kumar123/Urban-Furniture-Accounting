const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateUser);

router.get(
  '/payroll',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  dashboardController.getDashboardMetrics
);

router.get(
  '/attendance-overview',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  dashboardController.getAttendanceOverview
);

module.exports = router;
