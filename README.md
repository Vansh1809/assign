# Login-Signup Authentication System

A full-stack authentication system with a React frontend and Node.js backends, featuring role-based access control, profile picture uploads, and secure user authentication.

## 🏗️ Architecture

This project consists of three main components:

### 1. **Frontend (login-signup)**
- React-based single-page application
- Responsive user interface for login and signup
- Profile picture upload functionality
- Role selection during signup
- Client-side routing with React Router

### 2. **Auth Backend (auth-backend)**
- Express.js server with MongoDB integration
- User authentication and authorization
- Role-based access control (Admin, User, Moderator)
- Profile picture upload handling with Multer
- File validation and size limits (5MB max)
- RESTful API endpoints

### 3. **Auth Service (auth-service)**
- Secondary authentication service
- JWT token generation and validation
- User database management
- Support for multiple roles
- Enhanced security features

## 🚀 Features

- ✅ User Registration (Signup) with profile picture
- ✅ User Login with JWT authentication
- ✅ Role-based access control (Admin, User, Moderator)
- ✅ Profile picture upload and storage
- ✅ Password hashing with bcryptjs
- ✅ CORS support for cross-origin requests
- ✅ File type validation (JPG, PNG, GIF, WebP)
- ✅ Responsive UI with React
- ✅ Environment configuration with dotenv

## 💻 Tech Stack

### Frontend
- **React** 19.2.6
- **React Router** 7.15.1
- **CSS** for styling

### Backend
- **Node.js** + **Express** 5.2.1
- **MongoDB** with **Mongoose** 9.6.2
- **Multer** 2.1.1 (file uploads)
- **bcryptjs** 3.0.3 (password hashing)
- **CORS** 2.8.6 (cross-origin requests)
- **JWT** 9.0.3 (token authentication)
- **dotenv** 17.4.2 (environment variables)

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)
- npm or yarn

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Login-signup
```

### 2. Install dependencies for all services

**Frontend:**
```bash
cd login-signup
npm install
```

**Auth Backend:**
```bash
cd ../auth-backend
npm install
```

**Auth Service:**
```bash
cd ../auth-service
npm install
```

### 3. Environment Variables

Create `.env` files in both backend directories:

**auth-backend/.env**
```
MONGODB_URI=mongodb://localhost:27017/login-signup
PORT=5000
```

**auth-service/.env**
```
MONGODB_URI=mongodb://localhost:27017/auth-service
PORT=5001
JWT_SECRET=your_jwt_secret_key
```

## 🏃 Running the Project

### Option 1: Run all services separately

**Terminal 1 - Frontend:**
```bash
cd login-signup
npm start
```
Frontend will run on `http://localhost:3000`

**Terminal 2 - Auth Backend:**
```bash
cd auth-backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 3 - Auth Service:**
```bash
cd auth-service
npm run dev
```
Service will run on `http://localhost:5001`

### Option 2: Using nodemon for auto-reload (development)
```bash
npm run dev  # in auth-backend or auth-service directories
```

## 📁 Project Structure

```
Login-signup/
├── login-signup/                 # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── AuthContext.js
│   │   ├── Components/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   └── Navbar.js
│   │   └── ...
│   └── package.json
│
├── auth-backend/                 # Main authentication backend
│   ├── server.js
│   ├── models/
│   │   ├── user.js
│   │   └── Role.js
│   ├── middleware/
│   │   └── upload.js
│   ├── uploads/                  # Profile pictures storage
│   └── package.json
│
├── auth-service/                 # Secondary auth service
│   ├── server.js
│   ├── controllers/
│   │   └── authController.js
│   ├── models/
│   │   ├── User.js
│   │   └── Role.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── uploads.js
│   ├── config/
│   │   └── db.js
│   └── package.json
│
└── package.json                  # Root package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/roles` - Get available roles

### Request/Response Format

**Signup:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "roleName": "User",
  "profilePicture": "file"
}
```

**Login:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## 🗄️ Database Schema

### User Model
- `email` - User email (unique)
- `password` - Hashed password
- `role` - Reference to Role document
- `profilePicture` - Profile picture filename
- `timestamps` - Created and updated dates

### Role Model
- `name` - Role name (Admin, User, Moderator)
- Values automatically initialized on server startup

## 🔒 Security Features

- Password hashing with **bcryptjs**
- JWT token-based authentication
- CORS configuration for secure cross-origin requests
- File upload validation (type and size)
- Environment variable protection
- Role-based access control

## 📝 Development Notes

### File Upload
- Maximum file size: **5MB**
- Allowed formats: **JPG, PNG, GIF, WebP**
- Stored in: `auth-backend/uploads/`

### Database Relationships
- **User ↔ Role**: Many-to-One relationship
- Each user is assigned a role from the Role collection

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## 📄 License

This project is licensed under the ISC License

## 👥 Author

Created by Vansh

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or provide correct Atlas connection string
- Update `MONGODB_URI` in `.env` files

### Port Already in Use
- Change port in `.env` files if default ports (5000, 5001) are in use

### CORS Issues
- Verify CORS is configured correctly in backend
- Ensure frontend URL is whitelisted in backend CORS settings

### File Upload Fails
- Check file size doesn't exceed 5MB
- Verify file format is supported (JPG, PNG, GIF, WebP)
- Ensure `uploads/` directory has write permissions

## 📞 Support

For issues or questions, please open an issue on the GitHub repository.

---

**Happy Coding!** 🚀
