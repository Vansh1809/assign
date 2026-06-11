# Local Deployment Guide - Assign Project

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm
- MongoDB Atlas account (already configured)

### Step 1: Install Dependencies

Run the following commands in the project root directory:

```bash
# Auth Service (Primary Backend with gRPC)
cd auth-service && npm install && cd ..

# Auth Backend (Alternative backend - Port 5001)
cd auth-backend && npm install && cd ..

# My OAuth App (OAuth2 + Staff Service)
cd my-oauth-app && npm install && cd ..

# Login Signup (React Frontend)
cd login-signup && npm install && cd ..
```

### Step 2: Environment Setup

The `.env` files are already configured for local development. Verify these settings:

**auth-service/.env:**
```
PORT=5000
MONGO_URI=mongodb://...your-connection-string...
JWT_SECRET=your_jwt_secret_key_change_this_in_production
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**login-signup/.env:**
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_MAP_TILES_URL=https://tiles.stadiamaps.com/styles/alimebright/{z}/{x}/{y}.png
```

**auth-backend/.env:** (Optional - runs on port 5001)
```
PORT=5001
MONGO_URI=mongodb://...your-connection-string...
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

### Step 3: Start the Services

Open separate terminal windows for each service:

#### Terminal 1: Auth Service (Required)
```bash
cd auth-service
npm start
```
Expected output:
- `🚀 Auth Service Running on standard port: 5000`
- `📡 Auth gRPC Server running on port 50051`

#### Terminal 2: React Frontend (Required)
```bash
cd login-signup
npm start
```
Expected output:
- Browser opens to `http://localhost:3000`
- React app connects to `http://localhost:5000/api`

#### Terminal 3: OAuth App (Optional - Staff Service)
```bash
cd my-oauth-app
npm start
```
Expected output:
- `📋 Staff REST Gateway running on http://localhost:3003`
- `📋 Staff gRPC Server running on port 3002`

#### Terminal 4: Auth Backend (Optional - Alternative Auth)
```bash
cd auth-backend
npm start
```
Expected output:
- `📋 Auth Backend Running on port 5001`

### Step 4: Test the Application

1. Open `http://localhost:3000` in your browser
2. Test Signup: Create a new account
3. Test Login: Use the created account to login
4. Check browser console for any errors (F12)

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Port 3000)              │
│                  login-signup/                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (REACT_APP_API_BASE_URL)
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Auth Service (Port 5000)                    │
│            ├─ REST API: /api/login, /api/signup         │
│            ├─ gRPC Server: :50051 (VerifyToken)         │
│            └─ MongoDB Connection                         │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ↓                           ↓
    OAuth App              Auth Backend
    (Port 3003)            (Port 5001)
    Staff Service          Alternative
    gRPC :3002             Auth Option
```

---

## 🐛 Troubleshooting

### "Failed to fetch" Error
- **Solution**: Make sure auth-service is running on port 5000
- Check `.env` in login-signup has correct `REACT_APP_API_BASE_URL`

### MongoDB Connection Error
- **Solution**: Verify MongoDB URI in `.env` is correct
- Check internet connection for MongoDB Atlas

### Port Already in Use
- **Solution**: Change the PORT in `.env` files (e.g., 5000 → 5000)
- Or: Kill existing process using the port

### gRPC Connection Refused
- **Solution**: Make sure auth-service is running first before oauth-app
- Check `AUTH_GRPC_URL` in my-oauth-app/server.js is `localhost:50051`

### CORS Error in Browser
- **Solution**: CORS is configured for localhost:3000 in auth-service
- If using different port, update auth-service CORS configuration

---

## 📦 Service Ports & URLs

| Service | Port | URL | Type |
|---------|------|-----|------|
| React Frontend | 3000 | http://localhost:3000 | Browser |
| Auth Service (REST) | 5000 | http://localhost:5000/api | REST API |
| Auth Service (gRPC) | 50051 | localhost:50051 | gRPC |
| Auth Backend | 5001 | http://localhost:5001 | REST API (Optional) |
| OAuth App (REST) | 3003 | http://localhost:3003 | REST API (Optional) |
| OAuth App (gRPC) | 3002 | localhost:3002 | gRPC (Optional) |

---

## 🔐 API Endpoints

### Authentication
- `POST /api/login` - Login user
- `POST /api/signup` - Register new user
- `GET /api/roles` - Fetch available roles
- `GET /api/health` - Health check

### Admin (Protected)
- `GET /api/admin/users` - List all users (requires token)

### gRPC
- `AuthService.VerifyToken` - Verify JWT token via gRPC

---

## 📝 Notes

1. **MongoDB**: Using shared MongoDB Atlas instance
2. **JWT Secret**: Change in production
3. **CORS**: Currently allowing localhost:3000, localhost:3001
4. **gRPC**: Auth service provides token verification via gRPC for microservices

---

## 🚀 Deploying to Render

When ready to deploy to Render:

1. Push to GitHub
2. Create Web Service on Render for auth-service
3. Create Static Site on Render for login-signup
4. Set environment variables in Render Dashboard
5. Update `REACT_APP_API_BASE_URL` to your Render backend URL

See deployment logs in Render Dashboard for issues.
