const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            // Keep enum broad enough for required default RBAC roles.
            enum: ['Super Admin', 'Admin', 'Manager', 'User', 'Moderator', 'Vendor'],
        },


        // RBAC: permissions granted to this role.
        // Store as an array of strings (e.g. "ADMIN_USERS_READ").
        permissions: {
            type: [String],
            default: [],
        },

        // Protected system roles should not be deletable from admin APIs.
        isSystemRole: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Role', RoleSchema);
