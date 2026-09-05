const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateUser);

router.get('/', payslipController.getPayslips);
router.get('/:id', payslipController.getPayslipById);
router.get('/:id/pdf', payslipController.getPayslipPDF);

router.post(
  '/:id/send-email',
  authorizeRoles('HR Payroll Manager', 'Admin'),
  payslipController.sendEmail
);

module.exports = router;
