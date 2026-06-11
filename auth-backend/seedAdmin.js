const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/user');
const Role = require('./models/Role');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI?.trim();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || 'admin1234';
const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || 'Admin';

async function ensureRole(roleName) {
  let role = await Role.findOne({ name: roleName });
  if (!role) {
    role = await Role.create({ name: roleName });
  }
  return role;
}

async function seedAdminUser() {
  if (!MONGO_URI) {
    console.warn('⚠️ MONGO_URI not set. seedAdmin.js requires MongoDB. Exiting.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const adminRole = await ensureRole('Admin');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`✅ Admin user already exists for email: ${ADMIN_EMAIL}`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: adminRole._id,
    profilePicture: '',
  });

  console.log(`✅ Seeded admin user: ${ADMIN_EMAIL}`);
}

seedAdminUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ seedAdminUser failed:', err);
    process.exit(1);
  });


