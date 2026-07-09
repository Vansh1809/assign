const express = require('express');

const { getAdminUsers, listRoles, listPermissions, updateRolePermissions } = require('../controllers/adminController');
const { requireAdmin, requirePermission } = require('../middleware/adminGuard');

const router = express.Router();

// Mounted under /api/admin in server.js.

router.get('/users', requireAdmin, getAdminUsers);

// Roles & permissions
router.get('/roles', requireAdmin, listRoles);
router.post('/roles', requireAdmin, require('./../controllers/adminController').createRole);
router.get('/roles/:roleId', requireAdmin, require('./../controllers/adminController').getRoleById);
router.put('/roles/:roleId', requireAdmin, require('./../controllers/adminController').updateRole);
router.delete('/roles/:roleId', requireAdmin, require('./../controllers/adminController').deleteRole);

router.get('/permissions', requireAdmin, listPermissions);

router.put(
  '/roles/:roleId/permissions',
  requireAdmin,
  updateRolePermissions
);

router.get(
  '/roles/:roleId/permissions',
  requireAdmin,
  require('./../controllers/adminController').getRolePermissions
);


module.exports = router;


