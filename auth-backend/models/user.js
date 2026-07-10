const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role', // Role model se link karne ke liye
        required: true
    },
    // Admin UI status mapping: 'Active' | 'Inactive'
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    // Optional phone (UI requires phone field)
    phone: {
        type: String,
        default: ''
    }
}, { timestamps: true });


// Sahi tarike se model ko export karna (Taki 'User.findOne is not a function' error na aaye)
const User = mongoose.model('User', UserSchema);
module.exports = User;
