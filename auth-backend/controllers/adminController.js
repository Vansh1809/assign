const User = require('../models/user');


// Note: `server.js` contains an in-memory fallback for users when Mongo isn't configured.
// To keep this controller simple, we only support Mongo-backed responses here.
// If you run without MONGO_URI, /api/admin/users will return an empty list.

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
        ? `http://localhost:5000/uploads/${u.profilePicture}`
        : null,
    }));

    res.json({ users: response });
  } catch (err) {
    console.error('getAdminUsers error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

module.exports = {
  getAdminUsers,
};

