const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Admin', 'User', 'Moderator']
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);