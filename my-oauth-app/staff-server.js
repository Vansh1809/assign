const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { v4: uuidv4 } = require('uuid');

const PROTO_FILE = './staff.proto';
const PORT = 3002;

const packageDefinition = protoLoader.loadSync(PROTO_FILE, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const staffProto = grpc.loadPackageDefinition(packageDefinition).staff;

// In-memory database
let staffList = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'Manager',
        department: 'IT'
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@company.com',
        role: 'Developer',
        department: 'IT'
    }
];

const staffService = {
    addStaff: (call, callback) => {
        const { name, email, role, department } = call.request;
        
        const newStaff = {
            id: uuidv4(),
            name: name || '',
            email: email || '',
            role: role || 'Staff',
            department: department || 'General'
        };
        
        staffList.push(newStaff);
        
        callback(null, {
            success: true,
            message: 'Staff added successfully',
            ...newStaff
        });
    },
    
    getStaff: (call, callback) => {
        const { id } = call.request;
        const staff = staffList.find(s => s.id === id);
        
        if (staff) {
            callback(null, { success: true, message: 'Staff found', ...staff });
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                message: 'Staff not found'
            });
        }
    },
    
    listStaff: (call, callback) => {
        callback(null, { staff: staffList });
    },
    
    deleteStaff: (call, callback) => {
        const { id } = call.request;
        const index = staffList.findIndex(s => s.id === id);
        
        if (index !== -1) {
            staffList.splice(index, 1);
            callback(null, { success: true, message: 'Staff deleted' });
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                message: 'Staff not found'
            });
        }
    }
};

function main() {
    const server = new grpc.Server();
    server.addService(staffProto.StaffService.service, staffService);
    
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(`Failed to bind gRPC server: ${err.message}`);
            return;
        }
        console.log(`👥 Staff Microservice running on port ${port}`);
    });
}

main();