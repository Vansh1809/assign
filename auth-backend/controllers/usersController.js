const User = require('../models/user');
const Role = require('../models/Role');

const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://localhost:5000';

// =======================
// Response helpers
// =======================
const sendSuccess = (res, operation, data, message = 'Success') => {
  return res.status(200).json({
    status: 'SUCCESS',
    operation,
    data,
    message,
  });
};

const sendValidationError = (res, operation, errors, message) => {
  return res.status(400).json({
    status: 'VALIDATION_ERROR',
    operation,
    errors,
    message: message || 'Please fix the following errors',
  });
};

const sendSystemError = (res, operation, code, message, detail, actionable) => {
  return res.status(code).json({
    status: 'ERROR',
    operation,
    code,
    message,
    detail: detail || undefined,
    actionable: actionable || undefined,
  });
};

// =======================
// Validation helpers
// =======================
const validateUserId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (!trimmed) return false;
  // alphanumeric only, as requested
  return /^[a-z0-9]+$/i.test(trimmed);
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim();
  if (!e) return false;
  // basic email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

const allowedEditRoles = ['ADMIN', 'EDITOR', 'VIEWER'];
const validateRoleEnum = (role) => {
  if (!role || typeof role !== 'string') return false;
  const r = role.trim().toUpperCase();
  return allowedEditRoles.includes(r);
};

const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const n = name.trim();
  return n.length >= 2 && n.length <= 100;
};

const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const validateStatusEnum = (status) => {
  if (!status || typeof status !== 'string') return false;
  const s = status.trim().toUpperCase();
  return allowedStatuses.includes(s);
};

const normalizeRoleForDb = (roleEnum) => {
  // Current backend Role model uses values like: 'Super Admin', 'Admin', 'Manager', 'User', ...
  // We map the required enums to existing Role names.
  // If your Role catalog differs, adjust this mapping.
  switch (roleEnum) {
    case 'ADMIN':
      return 'Admin';
    case 'EDITOR':
      return 'Moderator';
    case 'VIEWER':
      return 'User';
    default:
      return null;
  }
};

const normalizeStatusForDb = (statusEnum) => {
  // User model stores: 'Active' | 'Inactive'
  switch (statusEnum) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'SUSPENDED':
      // no dedicated enum in schema; best-effort map
      return 'Inactive';
    default:
      return 'Active';
  }
};

// =======================
// Mapping
// =======================
const mapUserForAdmin = (u) => {
  if (!u) return null;
  const roleName = typeof u.role === 'object' && u.role ? u.role.name : u.role;

  // Permissions come from populated role permissions (or empty)
  const permissions = Array.isArray(u.role?.permissions) ? u.role.permissions : [];

  // Avatar requested: use profilePicture mapping
  const avatar = u.profilePicture
    ? `${API_BASE_URL}/uploads/${u.profilePicture}`
    : null;

  // Normalize status to required-ish values for UI.
  // Current schema uses Active/Inactive.
  const statusDb = u.status || 'Active';
  const status = statusDb === 'Inactive' ? 'INACTIVE' : 'ACTIVE';

  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: typeof roleName === 'string' ? roleName : null,
    status,
    createdAt: u.createdAt,
    avatar,
    permissions,
  };
};

// =======================
// Audit logging
// =======================
const auditLog = async (event) => {
  try {
    // Minimal local logging for now; wire to DB/log system later.
    // Hide internals from client.
    // event: { operation, targetUserId, actorId, actorEmail, at }
    console.log('[AUDIT]', JSON.stringify({
      ...event,
      at: new Date().toISOString(),
    }));
  } catch (_) {
    // ignore
  }
};

// =======================
// VIEW user
// =======================
const getUserById = async (req, res) => {
  const operation = 'VIEW';
  try {
    const { id } = req.params;

    if (!validateUserId(id)) {
      return sendSystemError(
        res,
        operation,
        404,
        'This user no longer exists or access was denied.',
        'Invalid user id format'
      );
    }

    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
      return sendSystemError(
        res,
        operation,
        404,
        'This user no longer exists or access was denied.',
        'MongoDB not configured',
        'Try again later'
      );
    }

    const user = await User.findById(id).populate('role').exec();
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        operation,
        code: 404,
        message:
          'User not found (404). This user may have been deleted or access was denied.',
        actionable: 'Refresh the admin view and ensure you have access.',
      });
    }

    await auditLog({
      operation,
      targetUserId: String(id),
      actorId: req?.auth?.id || null,
      actorEmail: req?.auth?.email || null,
    });

    const data = mapUserForAdmin(user);
    return sendSuccess(res, operation, data, 'User details retrieved');
  } catch (err) {
    console.error('getUserById error:', err);
    return sendSystemError(
      res,
      operation,
      500,
      'Server error. Please try again',
      String(err),
      'Try again'
    );
  }
};

// list endpoint still used by frontend; return minimal mapping but structured protocol
const listAdminUsers = async (req, res) => {
  const operation = 'VIEW';
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) return res.json({ status: 'SUCCESS', operation, data: { users: [] }, message: 'Success' });

    const users = await User.find({})
      .populate('role')
      .select('name email phone profilePicture role status createdAt updatedAt');

    const mapped = users.map(mapUserForAdmin);

    await auditLog({
      operation: 'LIST',
      targetUserId: null,
      actorId: req?.auth?.id || null,
      actorEmail: req?.auth?.email || null,
    });

    return res.status(200).json({
      status: 'SUCCESS',
      operation,
      data: { users: mapped },
      message: 'Users retrieved',
    });
  } catch (err) {
    console.error('listAdminUsers error:', err);
    return sendSystemError(
      res,
      operation,
      500,
      'Server error. Please try again',
      String(err),
      'Try again'
    );
  }
};

// =======================
// EDIT user
// =======================
const updateUser = async (req, res) => {
  const operation = 'EDIT';
  try {
    const actorRole = String(req?.auth?.role || '').toLowerCase();
    if (!['super admin', 'admin'].includes(actorRole)) {
      return sendSystemError(
        res,
        operation,
        403,
        "You don't have permission to perform this action",
        'Permission denied',
        'Ask an admin to grant access'
      );
    }

    const { id } = req.params;
    if (!validateUserId(id)) {
      return sendSystemError(
        res,
        operation,
        404,
        'This user no longer exists or access was denied.',
        'Invalid user id format',
        'Check user id'
      );
    }

    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
      return sendSystemError(
        res,
        operation,
        500,
        'Server error. Please try again',
        'MongoDB not configured',
        'Try again later'
      );
    }

    const body = req.body || {};
    const fields = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      status: body.status,
      profilePicture: body.profilePicture,
    };

    const errors = {};

    if (!validateName(fields.name)) {
      errors.name = 'Name must be between 2 and 100 characters';
    }

    if (!validateEmail(fields.email)) {
      errors.email = 'Email must be a valid email format';
    }

    if (!validateRoleEnum(fields.role)) {
      errors.role = 'Role must be one of [ADMIN, EDITOR, VIEWER]';
    }

    if (!validateStatusEnum(fields.status)) {
      errors.status = 'Status must be one of [ACTIVE, INACTIVE, SUSPENDED]';
    }

    // phone is not part of your protocol validation matrix; keep minimal format check
    if (fields.phone != null && String(fields.phone).trim().length > 0) {
      const digits = String(fields.phone).replace(/\D/g, '');
      if (digits.length < 8) errors.phone = 'Phone looks invalid';
    }

    if (Object.keys(errors).length > 0) {
      await auditLog({
        operation,
        targetUserId: String(id),
        actorId: req?.auth?.id || null,
        actorEmail: req?.auth?.email || null,
      });
      return res.status(400).json({
        status: 'VALIDATION_ERROR',
        operation,
        errors,
        message: 'Please fix the following errors',
      });
    }

    // DEBUG: normalize server payload shape to help root-cause failures.
    // (Safe to keep; remove later if noisy)
    // console.log('[updateUser payload]', { id, fields });


    // target exists
    const user = await User.findById(id).exec();
    if (!user) {
      return sendSystemError(
        res,
        operation,
        404,
        'This user no longer exists or access was denied.',
        'User not found',
        'Refresh and try again'
      );
    }

    // ETag check via Mongoose __v
    const ifMatch = req.header('If-Match');
    const currentEtag = String(user.__v ?? 0);

    if (!ifMatch) {
      return sendSystemError(
        res,
        operation,
        409,
        'Another admin updated this. Refresh to sync',
        'Missing If-Match header',
        'Refresh the user and resend with If-Match'
      );
    }

    const cleaned = String(ifMatch).replace(/W\/"|"/g, '').trim();
    if (cleaned !== currentEtag) {
      return sendSystemError(
        res,
        operation,
        409,
        'Another admin updated this. Refresh to sync',
        `If-Match(${cleaned}) != __v(${currentEtag})`,
        'Refresh to get latest version'
      );
    }

    // Email uniqueness (case-insensitive)
    const emailNorm = String(fields.email).trim().toLowerCase();
    const emailOwner = await User.findOne({
      email: { $regex: `^${emailNorm}$`, $options: 'i' },
      _id: { $ne: id },
    }).exec();

    if (emailOwner) {
      return res.status(400).json({
        status: 'VALIDATION_ERROR',
        operation,
        errors: { email: 'Email already in use' },
        message: 'Please fix the following errors',
      });
    }

    const roleDbName = normalizeRoleForDb(String(fields.role).trim().toUpperCase());
    const roleDoc = roleDbName ? await Role.findOne({ name: roleDbName }).exec() : null;

    if (!roleDoc) {
      return sendSystemError(
        res,
        operation,
        500,
        'Server error. Please try again',
        'Role mapping not found for provided role enum',
        'Contact admin/support'
      );
    }

    // Immutable fields protection
    // We only update allowed fields.
    user.name = String(fields.name).trim();
    user.email = String(fields.email).trim();
    user.phone = fields.phone ? String(fields.phone) : '';
    user.role = roleDoc._id;
    user.status = normalizeStatusForDb(String(fields.status).trim().toUpperCase());
    if (typeof fields.profilePicture === 'string') user.profilePicture = fields.profilePicture;

    await user.save();

    await auditLog({
      operation,
      targetUserId: String(id),
      actorId: req?.auth?.id || null,
      actorEmail: req?.auth?.email || null,
    });

    // Return ready_to_save structure as requested (even though we already saved in this controller).
    // Keep it consistent: return VALID + fields and ready_to_save true.
    const updated = await User.findById(id).populate('role').exec();
    const mapped = mapUserForAdmin(updated);

    return res.status(200).json({
      status: 'SUCCESS',
      operation,
      data: {
        user: mapped,
        // protocol-required payload:
        result: {
          status: 'VALID',
          fields: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: String(fields.role).trim().toUpperCase(),
            status: String(fields.status).trim().toUpperCase(),
          },
          ready_to_save: true,
          etag: String(updated.__v ?? 0),
        },
      },
      message: 'User update validated and saved',
    });
  } catch (err) {
    // Required debugging: print the actual error details.
    console.error('updateUser error.message:', err?.message);
    console.error('updateUser error.stack:', err?.stack);
    console.error('updateUser request:', {
      params: req?.params,
      body: req?.body,
    });

    return res.status(500).json({
      status: 'ERROR',
      operation,
      message: 'Server error updating user',
      detail: err?.message ? String(err.message) : String(err),
      // best-effort: include mongoose validation errors in structured form
      validation: err?.errors || err?.details || undefined,
    });
  }
};



// =======================
// DELETE user
// =======================
const deleteUserById = async (req, res) => {
  const operation = 'DELETE';
  try {
    const actorRole = String(req?.auth?.role || '').toLowerCase();
    if (!['super admin', 'admin'].includes(actorRole)) {
      return sendSystemError(
        res,
        operation,
        403,
        "You don't have permission to perform this action",
        'Permission denied',
        'Ask an admin to grant access'
      );
    }

    const { id } = req.params;
    if (!validateUserId(id)) {
      return sendSystemError(
        res,
        operation,
        404,
        'This user no longer exists or access was denied.',
        'Invalid user id format',
        'Check user id'
      );
    }

    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
      return sendSystemError(
        res,
        operation,
        500,
        'Server error. Please try again',
        'MongoDB not configured',
        'Try again later'
      );
    }

    const target = await User.findById(id).populate('role').exec();
    if (!target) {
      return res.status(404).json({
        status: 'ERROR',
        operation,
        code: 404,
        message:
          'User not found (404). This user may have been deleted or access was denied.',
        actionable: 'Refresh the admin view and ensure you have access.',
      });
    }

    const actorId = String(req?.auth?.id || '');
    if (actorId && String(actorId) === String(id)) {
      return sendSystemError(
        res,
        operation,
        403,
        'You cannot delete your own account',
        'Self deletion prevented',
        'Choose another user'
      );
    }

    // Last remaining admin prevention (best-effort using role name)
    const adminRole = await Role.findOne({ name: 'Admin' }).exec();
    if (adminRole) {
      const adminCount = await User.countDocuments({
        role: adminRole._id,
      }).exec();

      const isTargetAdmin = String(target.role?._id || '') === String(adminRole._id);
      if (isTargetAdmin && adminCount <= 1) {
        return sendSystemError(
          res,
          operation,
          409,
          'This user cannot be deleted due to system constraints',
          'Last remaining admin deletion prevented',
          'Assign another admin before deleting'
        );
      }
    }

    // Active sessions check: no session store in this repo.
    // Best-effort: if you later add session tracking, plug it here.
    // For now, always allow and return SAFE_TO_DELETE.

    await auditLog({
      operation,
      targetUserId: String(id),
      actorId: actorId || null,
      actorEmail: req?.auth?.email || null,
    });

    return res.status(200).json({
      status: 'SUCCESS',
      operation,
      data: {
        // protocol-required payload
        result: {
          status: 'SAFE_TO_DELETE',
          user_info: mapUserForAdmin(target),
          confirmation_required: true,
        },
      },
      message: 'User is safe to delete (confirmation required)',
    });
  } catch (err) {
    console.error('deleteUserById error:', err);
    return sendSystemError(
      res,
      operation,
      500,
      'Server error. Please try again',
      String(err),
      'Try again'
    );
  }
};

module.exports = {
  getUserById,
  updateUser,
  deleteUserById,
  listAdminUsers,
};


