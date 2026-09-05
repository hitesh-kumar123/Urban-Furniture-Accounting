const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { schemas } = require('../validators/schemas');

router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.get('/me', authenticateUser, authController.getMe);
router.get('/users', authenticateUser, authController.getUsers);
router.patch('/users/:id/role', authenticateUser, authController.updateUserRole);

module.exports = router;
