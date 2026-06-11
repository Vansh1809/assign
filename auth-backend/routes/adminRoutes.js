const express = require('express');

const { getAdminUsers } = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminGuard');

const router = express.Router();

// Mounted under /api/admin in server.js.
// This route is admin-only.

router.get('/users', requireAdmin, getAdminUsers);


module.exports = router;

