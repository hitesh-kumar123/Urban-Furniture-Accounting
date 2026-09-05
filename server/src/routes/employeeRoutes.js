const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);

router.post(
  '/',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.createEmployee),
  employeeController.createEmployee
);

router.put(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.updateEmployee),
  employeeController.updateEmployee
);

router.delete(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll Manager', 'Admin'),
  employeeController.deleteEmployee
);

module.exports = router;
