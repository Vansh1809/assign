const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');


require('dotenv').config();

const User = require('./models/user');
const Role = require('./models/Role');

const app = express();


// ================= MIDDLEWARE =================

app.use(express.json());

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


// ================= STATIC UPLOAD FOLDER =================

app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);


// ================= MULTER CONFIG =================

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() +
            path.extname(file.originalname)
        );
    }

});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


// ================= MONGODB =================

const rawMongoUri =
    process.env.MONGO_URI?.trim() || '';

const MONGO_URI =
    rawMongoUri
        .replace(/^MONGO_URI=/i, '')
        .trim();

let useMongo = false;

const usersInMemory = [];

if (MONGO_URI) {

    mongoose.connect(MONGO_URI)

    .then(async () => {

        useMongo = true;

        console.log('✅ Connected to MongoDB');
        
        // Initialize default roles
        await initializeRoles();

    })

    .catch(err => {

        console.error(
            '❌ MongoDB connection error:',
            err
        );

        console.error(
            '⚠️ Falling back to in-memory user storage.'
        );

    });

} else {

    console.warn(
        '⚠️ No MONGO_URI configured.'
    );

}

// ================= INITIALIZE ROLES =================

const initializeRoles = async () => {
    try {
        // Verify Role model is loaded
        if (!Role || typeof Role.findOne !== 'function') {
            console.warn('⚠️ Role model not properly loaded, skipping role initialization');
            return;
        }
        
        const roleNames = ['Admin', 'User', 'Moderator'];
        
        for (const roleName of roleNames) {
            const existingRole = await Role.findOne({ name: roleName });
            if (!existingRole) {
                await Role.create({ name: roleName });
                console.log(`✅ Role '${roleName}' created`);
            } else {
                console.log(`✅ Role '${roleName}' already exists`);
            }
        }
    } catch (error) {
        console.error('❌ Error initializing roles:', error.message);
    }
};


// ================= HELPERS =================

const findUserByEmail = async (email) => {

    if (useMongo) {

        return User.findOne({ email });

    }

    return usersInMemory.find(
        (user) => user.email === email
    );

};


const saveUser = async (userData) => {

    if (useMongo) {

        return new User(userData).save();

    }

    usersInMemory.push(userData);

    return userData;

};

const getRoleByName = async (roleName) => {
    if (useMongo) {
        return Role.findOne({ name: roleName });
    }
    return null;
};


// ================= SIGNUP =================

app.post(
    '/api/signup',

    upload.single('profilePicture'),

    async (req, res) => {

        try {

            const {
                name,
                email,
                password,
                roleName
            } = req.body;


            // VALIDATION

            if (!name || !email || !password) {

                return res.status(400).json({
                    message:
                        'All fields are required.'
                });

            }


            // CHECK USER

            const userExists =
                await findUserByEmail(email);

            if (userExists) {

                return res.status(400).json({

                    message:
                        'An account with this email already exists.'

                });

            }


            // GET ROLE ID
            
            let roleId = null;
            if (useMongo) {
                const requestedRole = (roleName && typeof roleName === 'string') ? await getRoleByName(roleName) : null;
                const defaultRole = requestedRole || await getRoleByName('User');
                roleId = defaultRole ? defaultRole._id : null;
            }


            // HASH PASSWORD

            const salt =
                await bcrypt.genSalt(10);

            const hashedPassword =
                await bcrypt.hash(password, salt);


            // SAVE USER

            const newUser = await saveUser({

                name,
                email,

                password: hashedPassword,

                role: roleId,

                profilePicture: req.file
                    ? req.file.filename
                    : ''

            });


            res.status(201).json({

                message:
                    'User registered successfully!',
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    profilePicture: newUser.profilePicture ? `http://localhost:5000/uploads/${newUser.profilePicture}` : null
                }

            });

        }

        catch (error) {

            console.error(error);
            
            // Handle multer errors
            if (error instanceof multer.MulterError) {
                return res.status(400).json({
                    message: `File upload error: ${error.message}`
                });
            }
            
            if (error.message.includes('Only image files')) {
                return res.status(400).json({
                    message: error.message
                });
            }

            res.status(500).json({

                message:
                    'Server error. Please try again later.'

            });

        }

    }
);


// ================= LOGIN =================

app.post('/api/login', async (req, res) => {

    try {

        const { email, password } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                message:
                    'Email and password are required.'

            });

        }


        const user =
            await findUserByEmail(email);

        if (!user) {

            return res.status(401).json({

                message:
                    'Invalid email or password.'

            });

        }


        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {

            return res.status(401).json({

                message:
                    'Invalid email or password.'

            });

        }


        // Populate role information
        let userWithRole = user;
        let roleName = null;

        if (useMongo && user.role) {
            userWithRole = await User.findById(user._id).populate('role');
            roleName = userWithRole.role?.name || null;
        }

        const token = jwt.sign(
            {
                id: userWithRole._id,
                role: roleName
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        res.json({

            message: 'Login successful',
            token,

            user: {

                id: userWithRole._id,

                name: userWithRole.name,

                email: userWithRole.email,

                role: userWithRole.role,

                profilePicture:
                    userWithRole.profilePicture
                        ? `http://localhost:5000/uploads/${userWithRole.profilePicture}`
                        : null

            }

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                'Server error. Please try again later.'

        });

    }

});


// ================= AUTH (JWT) MIDDLEWARE =================

const authRequired = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        const [type, token] = header.split(' ');

        if (type !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Missing Authorization token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.auth = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid/expired token' });
    }
};

// ================= ADMIN ROUTES =================
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/admin', authRequired, adminRoutes);

// ================= GATEWAY ROUTES =================
const gatewayRoutes = require("./routes/gatewayRoutes");
app.use("/api/gateway", gatewayRoutes);


// ================= ROLES =================

app.get('/api/roles', async (req, res) => {
    try {
        if (useMongo) {
            const roles = await Role.find();
            res.json(roles);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching roles' });
    }
});


// ================= HEALTH =================

app.get('/api/health', (req, res) => {

    res.json({

        status: 'ok',

        env:
            process.env.NODE_ENV ||
            'development'

    });

});


// ================= SERVER =================

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});
