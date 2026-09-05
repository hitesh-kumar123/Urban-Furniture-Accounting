const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.use(authenticateUser);

router.get(
  '/applicable',
  authorizeRoles('Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  contractController.getApplicableContractForPeriod
);

router.get(
  '/',
  authorizeRoles('Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  contractController.getContracts
);

router.get(
  '/:id',
  authorizeRoles('Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  contractController.getContractById
);

router.post(
  '/',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.createContract),
  contractController.createContract
);

router.put(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'),
  validate(schemas.updateContract),
  contractController.updateContract
);

router.delete(
  '/:id',
  authorizeRoles('HR Manager', 'HR Payroll Manager', 'Admin'),
  contractController.deleteContract
);

module.exports = router;
