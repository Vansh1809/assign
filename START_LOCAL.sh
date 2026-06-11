#!/bin/bash
# Local Deployment Setup Guide for Assign Project

echo "🚀 Starting Local Deployment..."

# Step 1: Install auth-service dependencies
echo "📦 Installing auth-service dependencies..."
cd auth-service
npm install
npm install @grpc/grpc-js @grpc/proto-loader
cd ..

# Step 2: Install auth-backend dependencies
echo "📦 Installing auth-backend dependencies..."
cd auth-backend
npm install
cd ..

# Step 3: Install my-oauth-app dependencies
echo "📦 Installing my-oauth-app dependencies..."
cd my-oauth-app
npm install
cd ..

# Step 4: Install login-signup dependencies
echo "📦 Installing login-signup dependencies..."
cd login-signup
npm install
cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "📝 To start the services, run these commands in separate terminals:"
echo ""
echo "Terminal 1 - Auth Service (gRPC + REST):"
echo "  cd auth-service && npm start"
echo ""
echo "Terminal 2 - React App:"
echo "  cd login-signup && npm start"
echo ""
echo "Optional Services:"
echo "Terminal 3 - Auth Backend:"
echo "  cd auth-backend && npm start"
echo ""
echo "Terminal 4 - OAuth App:"
echo "  cd my-oauth-app && npm start"
echo ""
echo "📌 Environment Variables:"
echo "  - auth-service PORT: 5000 (with gRPC on 50051)"
echo "  - login-signup: connects to http://localhost:5000/api"
echo ""
echo "🌐 Access the app at: http://localhost:3000"
