const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const GRPC_PORT = 3002;
const REST_PORT = 3003;
const AUTH_GRPC_URL = 'localhost:50051';
const AUTH_PROTO_PATH = path.join(__dirname, 'auth.proto');
const STAFF_PROTO_PATH = path.join(__dirname, 'staff.proto');

// Load gRPC client
const packageDefinition = protoLoader.loadSync(AUTH_PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;
const authClient = new authProto.AuthService(AUTH_GRPC_URL, grpc.credentials.createInsecure());

// In-memory staff store
const staffList = [];

// gRPC Server Implementation for Staff
const staffServiceImplementation = {
    addStaff: (call, callback) => {
        const { name, email, role, department } = call.request;
        const newStaff = {
            id: uuidv4(),
            staffName: name,
            email,
            role,
            department
        };
        staffList.push(newStaff);
        console.log('👷 gRPC: Staff added:', newStaff);
        callback(null, { success: true, message: 'Staff saved via gRPC', id: newStaff.id, name: newStaff.staffName });
    }
};

function startStaffGrpcServer() {
    const staffDef = protoLoader.loadSync(STAFF_PROTO_PATH, { keepCase: false });
    const staffProto = grpc.loadPackageDefinition(staffDef).staff;
    const server = new grpc.Server();
    server.addService(staffProto.StaffService.service, staffServiceImplementation);
    server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) return console.error(err);
        server.start();
        console.log(`📋 Staff gRPC Server running on port ${port}`);
    });
}

// REST logic remains for external gateway access
app.post('/staff/add', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Connect to Auth Microservice via gRPC to verify the token
    authClient.VerifyToken({ token }, (err, response) => {
        if (err) {
            return res.status(500).json({ error: 'Auth gRPC communication failed', details: err.message });
        }

        if (!response.active) {
            return res.status(401).json({ error: 'Unauthorized', details: response.error });
        }

        // If authenticated, perform staff addition
        const { staffName, role, email, department } = req.body;
        const newStaff = { id: uuidv4(), staffName, role, email, department, addedBy: response.name };
        staffList.push(newStaff);

        console.log(`✅ Staff added by ${response.name}:`, newStaff);
        res.status(201).json({ message: 'Staff added successfully', staff: newStaff });
    });
});

app.listen(REST_PORT, () => {
    console.log(`📋 Staff REST Gateway running on http://localhost:${REST_PORT}`);
    startStaffGrpcServer();
});