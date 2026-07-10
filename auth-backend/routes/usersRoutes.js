const express = require('express');

const router = express.Router();

const {
  getUserById,
  updateUser,
  deleteUserById,
  listAdminUsers,
} = require('../controllers/usersController');

const { requireAdmin } = require('../middleware/adminGuard');

// Admin-only endpoints for user management
router.get('/users', requireAdmin, listAdminUsers);
router.get('/users/:id', requireAdmin, getUserById);
router.put('/users/:id', requireAdmin, updateUser);
router.delete('/users/:id', requireAdmin, deleteUserById);

module.exports = router;

