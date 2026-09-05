const express = require('express');
const router = express.Router();
const salaryRuleController = require('../controllers/salaryRuleController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.get(
  '/',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  salaryRuleController.getSalaryRules
);

router.get(
  '/:id',
  authorizeRoles('HR Payroll User', 'HR Payroll Manager', 'Admin'),
  salaryRuleController.getSalaryRuleById
);

router.post(
  '/',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  validate(schemas.createSalaryRule),
  salaryRuleController.createSalaryRule
);

router.put(
  '/:id',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  validate(schemas.updateSalaryRule),
  salaryRuleController.updateSalaryRule
);

router.delete(
  '/:id',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  salaryRuleController.deleteSalaryRule
);

module.exports = router;
