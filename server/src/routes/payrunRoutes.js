const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.get(
  '/eligible-employees',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  payrunController.getPayrunEligibleEmployees
);

router.get(
  '/',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  payrunController.getPayruns
);

router.get(
  '/:id',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  payrunController.getPayrunById
);

router.post(
  '/',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.createPayrun),
  payrunController.createPayrun
);

router.put(
  '/:id',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.updatePayrun),
  payrunController.updatePayrun
);

// Payrun Processing Actions
router.post(
  '/:id/compute',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  payrunController.compute
);

router.post(
  '/:id/validate',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  payrunController.validate
);

router.post(
  '/:id/mark-paid',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  payrunController.markPaid
);

router.post(
  '/:id/send-payslips',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  payrunController.sendPayslips
);

module.exports = router;
