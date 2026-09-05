const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.get(
  '/',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  salaryStructureController.getSalaryStructures
);

router.get(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  salaryStructureController.getSalaryStructureById
);

router.post(
  '/',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  validate(schemas.createSalaryStructure),
  salaryStructureController.createSalaryStructure
);

router.put(
  '/:id',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  validate(schemas.updateSalaryStructure),
  salaryStructureController.updateSalaryStructure
);

router.delete(
  '/:id',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  salaryStructureController.deleteSalaryStructure
);

module.exports = router;
