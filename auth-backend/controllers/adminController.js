const User = require('../models/user');
const Role = require('../models/Role');

// Note: `server.js` contains an in-memory fallback for users when Mongo isn't configured.
// Role/permissions endpoints depend on Mongo because they store permissions in Role documents.

const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getAdminUsers = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
      return res.json({ users: [] });
    }

    const users = await User.find({})
      .populate('role')
      .select('name email role profilePicture');

    const response = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role?.name || null,
      profilePicture: u.profilePicture
        ? `${API_BASE_URL}/uploads/${u.profilePicture}`
        : null,
    }));

    res.json({ users: response });
  } catch (err) {
    console.error('getAdminUsers error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Known permission catalog (for validation and UI)
// If you add new features, add new permission strings here.
const permissionCatalog = [
  'ADMIN_USERS_READ',
  'ADMIN_ROLES_READ',
  'ADMIN_ROLES_PERMISSIONS_WRITE',
  'ADMIN_PERMISSIONS_READ',
];

const listRoles = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.json({ roles: [] });

    const roles = await Role.find({}).select('name permissions isSystemRole');

    res.json({
      roles: roles.map((r) => ({
        id: r._id,
        name: r.name,
        permissions: Array.isArray(r.permissions) ? r.permissions : [],
        isSystemRole: r.isSystemRole === true,
      })),
    });
  } catch (err) {
    console.error('listRoles error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching roles' });
  }
};

const listPermissions = async (req, res) => {
  try {
    res.json({ permissions: permissionCatalog });
  } catch (err) {
    console.error('listPermissions error:', err);
    res.status(500).json({ message: 'Server error fetching permissions' });
  }
};

const updateRolePermissions = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
      return res.status(500).json({ message: 'MongoDB required for permissions updates.' });
    }

    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: 'roleId is required' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions must be an array of strings' });
    }

    // Validate permission strings against catalog
    const invalid = permissions.filter(
      (p) => typeof p !== 'string' || !permissionCatalog.includes(p)
    );

    if (invalid.length > 0) {
      return res.status(400).json({
        message: 'Invalid permissions provided',
        invalid,
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Allow updates for both system and non-system roles.
    role.permissions = permissions;
    await role.save();

    res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        permissions: role.permissions,
      },
    });
  } catch (err) {
    console.error('updateRolePermissions error:', err);
    res.status(500).json({ message: 'Server error updating role permissions' });
  }
};

const getRoleById = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.status(404).json({ message: 'Role not found' });

    const { roleId } = req.params;
    if (!roleId) return res.status(400).json({ message: 'roleId is required' });

    const role = await Role.findById(roleId).select('name permissions');
    if (!role) return res.status(404).json({ message: 'Role not found' });

    return res.json({
      role: {
        id: role._id,
        name: role.name,
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
      },
    });
  } catch (err) {
    console.error('getRoleById error:', err);
    return res.status(500).json({ message: 'Server error fetching role' });
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.json({ permissions: [] });

    const { roleId } = req.params;
    if (!roleId) return res.status(400).json({ message: 'roleId is required' });

    const role = await Role.findById(roleId).select('permissions');
    if (!role) return res.status(404).json({ message: 'Role not found' });

    return res.json({
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    });
  } catch (err) {
    console.error('getRolePermissions error:', err);
    return res.status(500).json({ message: 'Server error fetching role permissions' });
  }
};

const createRole = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.status(500).json({ message: 'MongoDB required to create roles.' });

    const { name, permissions } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }

    const perms = Array.isArray(permissions) ? permissions : [];

    const invalid = perms.filter(
      (p) => typeof p !== 'string' || !permissionCatalog.includes(p)
    );

    if (invalid.length > 0) {
      return res.status(400).json({ message: 'Invalid permissions provided', invalid });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Role already exists' });
    }

    const role = await Role.create({ name, permissions: perms });

    return res.status(201).json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        permissions: role.permissions,
      },
    });
  } catch (err) {
    console.error('createRole error:', err);
    return res.status(500).json({ message: 'Server error creating role' });
  }
};

const updateRole = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.status(500).json({ message: 'MongoDB required to update roles.' });

    const { roleId } = req.params;
    const { name } = req.body;

    if (!roleId) return res.status(400).json({ message: 'roleId is required' });
    if (!name || typeof name !== 'string') return res.status(400).json({ message: 'name is required' });

    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    role.name = name;
    await role.save();

    return res.json({
      success: true,
      role: {
        id: role._id,
        name: role.name,
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
      },
    });
  } catch (err) {
    console.error('updateRole error:', err);
    return res.status(500).json({ message: 'Server error updating role' });
  }
};

const deleteRole = async (req, res) => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.status(500).json({ message: 'MongoDB required to delete roles.' });

    const { roleId } = req.params;
    if (!roleId) return res.status(400).json({ message: 'roleId is required' });

    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    // Protect system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        message: 'This role is protected and cannot be deleted',
      });
    }

    await Role.deleteOne({ _id: roleId });

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteRole error:', err);
    return res.status(500).json({ message: 'Server error deleting role' });
  }
};

const jsonError = (res, status, message, extra) => {
  const payload = { success: false, message };
  if (extra && typeof extra === 'object') Object.assign(payload, extra);
  return res.status(status).json(payload);
};

// Response wrapper for success
const jsonSuccess = (res, status, data) => {
  return res.status(status).json({ success: true, ...data });
};

module.exports = {
  getAdminUsers,
  listRoles,
  listPermissions,
  updateRolePermissions,
  getRoleById,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole,
  jsonError,
  jsonSuccess,
};




