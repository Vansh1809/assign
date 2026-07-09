const normalizeRole = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim().toLowerCase();
  // If role is accidentally sent as object
  return (value?.name || '').toString().trim().toLowerCase();
};

const normalizePermissions = (perms) => {
  if (!Array.isArray(perms)) return [];
  return perms
    .filter((p) => typeof p === 'string')
    .map((p) => p.trim());
};

const requireAdmin = (req, res, next) => {
  // If upstream auth middleware didn't authenticate, treat as unauthenticated.
  if (!req?.auth) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }

  const roleName = normalizeRole(req?.auth?.role);

  // Allow Super Admin and Admin
  if (!['super admin', 'admin'].includes(roleName)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!permission || typeof permission !== 'string') {
      return res
        .status(500)
        .json({ message: 'Invalid permission guard configuration' });
    }

    // Require authentication first
    if (!req?.auth) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    // Backward compatible: if token already includes permissions, use them.
    const tokenPerms = normalizePermissions(req?.auth?.permissions);

    // Cache effective permissions for this request
    if (!req._effectivePermissions) {
      // If token permissions are present (array), trust them.
      if (tokenPerms.length > 0) {
        req._effectivePermissions = tokenPerms;
      } else {
        // Fallback: derive from the assigned Role in DB.
        // We support a few possible shapes from auth middleware:
        // - req.auth.roleId
        // - req.user.roleId
        // - req.auth.role as an object with an id or _id
        const Role = require('../models/Role');

        const roleId =
          req?.auth?.roleId ||
          req?.user?.roleId ||
          req?.auth?.role?._id ||
          req?.auth?.role?.id ||
          null;

        if (!roleId) {
          req._effectivePermissions = [];
        } else {
          try {
            const roleDoc = await Role.findById(roleId).select('permissions name');
            req._effectivePermissions = normalizePermissions(
              roleDoc?.permissions || []
            );
          } catch (e) {
            // If DB lookup fails, deny by default to avoid privilege escalation.
            return res
              .status(500)
              .json({ message: 'Error resolving permissions' });
          }
        }
      }
    }

    const has = req._effectivePermissions.includes(permission);
    if (!has) {
      return res
        .status(403)
        .json({ message: `Permission required: ${permission}` });
    }

    next();
  };
};

module.exports = { requireAdmin, requirePermission };





