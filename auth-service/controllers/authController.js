const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs'); // Install using: npm install bcryptjs
const jwt = require('jsonwebtoken'); // Install using: npm install jsonwebtoken

// SIGNUP LOGIC
exports.signup = async (req, res) => {
    try {
        const { name, email, password, roleName } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check unique user
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already registered" });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Capture image filename path
        const profilePicPath = req.file ? req.file.path : undefined;

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: roleName || 'user',
            profilePicture: profilePicPath
        });

        await newUser.save();
        res.status(201).json({ message: "Registration successful!", userId: newUser._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LOGIN LOGIC
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ message: "Fields cannot be blank" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid Credentials" });

        // Compare password hashes
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        // Generate JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};