const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.get('/me', authenticateUser, authController.getMe);
router.get('/users', authenticateUser, authorizeRoles('Admin'), authController.getUsers);
router.patch('/users/:id/role', authenticateUser, authorizeRoles('Admin'), authController.updateUserRole);

module.exports = router;

