const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Admin', 'User', 'Moderator']
    }
});

module.exports = mongoose.model('Role', RoleSchema);