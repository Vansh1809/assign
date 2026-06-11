const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Absolute paths ke liye import kiya
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Role = require('./models/Role');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const AUTH_GRPC_PORT = process.env.AUTH_GRPC_PORT || 50051;
const AUTH_PROTO_PATH = path.join(__dirname, '../my-oauth-app/auth.proto');

const packageDefinition = protoLoader.loadSync(AUTH_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

const app = express();

const authServiceImplementation = {
    VerifyToken: async (call, callback) => {
        const { token } = call.request;
        if (!token) {
            return callback(null, { active: false, error: 'Token was not provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
            const user = await User.findById(decoded.id);
            if (!user) {
                return callback(null, { active: false, error: 'User not found' });
            }

            callback(null, {
                active: true,
                userId: user._id.toString(),
                username: user.email,
                name: user.name
            });
        } catch (error) {
            callback(null, { active: false, error: error.message });
        }
    }
};

function startAuthGrpcServer() {
    const server = new grpc.Server();
    server.addService(authProto.AuthService.service, authServiceImplementation);
    server.bindAsync(`0.0.0.0:${AUTH_GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error('Failed to start Auth gRPC server:', err);
            return;
        }
        server.start();
        console.log(`📡 Auth gRPC Server running on port ${port}`);
    });
}

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend ports (3000 aur 3001) dono ko block hone se bachane ke liye CORS setup
app.use(cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));

// STATIC DIRECTORY SETUP (Taaki browser direct URL se photo access kar sake)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/api', authRoutes);

// Additional endpoints
app.get('/api/roles', (req, res) => {
    // Return available roles for signup form
    const roles = [
        { _id: '1', name: 'user' },
        { _id: '2', name: 'admin' }
    ];
    res.json(roles);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service', env: process.env.NODE_ENV || 'development' });
});

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('✅ MongoDB Connected Successfully');
})
.catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
});

// SERVER INSTANCE
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Auth Service Running on standard port: ${PORT}`);
    startAuthGrpcServer();
});
