const express = require('express');
const router = express.Router();
const timeOffController = require('../controllers/timeOffController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

// Balance lookup
router.get('/balance', timeOffController.getEmployeeLeaveBalance);

// Time Off Types
router.get('/types', timeOffController.getTimeOffTypes);
router.post(
  '/types',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.createTimeOffType),
  timeOffController.createTimeOffType
);
router.put(
  '/types/:id',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.updateTimeOffType),
  timeOffController.updateTimeOffType
);
router.delete(
  '/types/:id',
  authorizeRoles('HR Manager', 'HR Payroll Manager', 'Admin'),
  timeOffController.deleteTimeOffType
);

// Leave Allocations
router.get('/allocations', timeOffController.getLeaveAllocations);
router.post(
  '/allocations',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.createLeaveAllocation),
  timeOffController.createLeaveAllocation
);
router.put(
  '/allocations/:id',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.updateLeaveAllocation),
  timeOffController.updateLeaveAllocation
);
router.post(
  '/allocations/:id/approve',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  timeOffController.approveLeaveAllocation
);

// Time Off Requests
router.get('/requests', timeOffController.getTimeOffRequests);
router.get('/requests/:id', timeOffController.getTimeOffRequestById);
router.post(
  '/requests',
  validate(schemas.createTimeOffRequest),
  timeOffController.createTimeOffRequest
);
router.put(
  '/requests/:id',
  validate(schemas.createTimeOffRequest),
  timeOffController.updateTimeOffRequest
);
router.post(
  '/requests/:id/approve',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  timeOffController.approveRequest
);
router.post(
  '/requests/:id/refuse',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.refuseTimeOffRequest),
  timeOffController.refuseRequest
);

module.exports = router;
