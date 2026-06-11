# Database Structure & Implementation Summary

## Overview
Updated the authentication system to implement a proper role-based structure with profile picture support.

---

## Key Changes

### 1. Database Schema Updates

#### Role Model (auth-backend/models/Role.js)
- Separate collection for roles
- Enum values: ['Admin', 'User', 'Moderator']
- Auto-initializes on server startup if roles don't exist

#### User Model (auth-backend/models/user.js)
- Added `role` field: References Role collection (ObjectId)
- Added `profilePicture` field: Stores filename path
- Timestamps enabled for audit trail

### 2. Backend Changes

#### Server.js Updates
✅ **Added**:
- Role model import
- Role initialization function (`initializeRoles()`)
- `getRoleByName()` helper function
- File upload directory creation
- File type validation (JPG, PNG, GIF, WebP only)
- File size limit (5MB maximum)
- `/api/roles` endpoint to fetch available roles
- Error handling for multer upload failures
- Populate role in login response

✅ **Modified Signup Endpoint**:
- Accepts `roleName` from form data
- Fetches role ObjectId from role name
- Links user to proper role record
- Returns user data including profile picture URL

✅ **Modified Login Endpoint**:
- Populates role information in response
- Returns full role object instead of just string

#### Upload Middleware (auth-backend/middleware/upload.js)
✅ **Enhancements**:
- Added directory creation check
- Added file type validation (MIME types)
- Added extension validation
- Added file size limit (5MB)
- Better error messages
- Unique filename generation with timestamp + random ID

### 3. Frontend Changes

#### Component/Signup.js
🔄 **Changed from**:
- localStorage-based signup
- No API integration
- No role support
- No file upload

🔄 **Changed to**:
- API-based signup via fetch
- FormData for file upload
- Role selection dropdown
- Profile picture upload
- Error/success messages
- Loading state management
- Input validation
- Auto-redirect after signup

#### Components/Signup.js
🔄 **Same updates as above**, plus:
- Integrated with existing Navbar
- Uses React Router navigation

#### LoginSignup/Signup.js
🔄 **Enhanced existing component**:
- Maintained advanced password validation
- Added role selection dropdown
- Added profile picture upload
- Changed to API-based signup
- Added role and profile pic to feature list

#### LoginSignups/Signup.js
🔄 **Modernized component**:
- Changed from localStorage to API
- Added role selection
- Added profile picture upload
- Better error handling
- Loading states

---

## Database Relationships

### User ↔ Role (Many-to-One)
```
Users Collection         Roles Collection
┌─────────────────┐     ┌──────────────────┐
│ User 1          │     │ Role 1           │
│  role: ObjId───────→  │  name: 'Admin'   │
└─────────────────┘     └──────────────────┘

│ User 2          │     │ Role 2           │
│  role: ObjId───────→  │  name: 'User'    │
└─────────────────┘     └──────────────────┘

│ User 3          │     │ Role 3           │
│  role: ObjId───────→  │  name: 'Moderator'
└─────────────────┘     └──────────────────┘
```

---

## API Endpoints

### 1. Signup
**POST** `/api/signup`
```
Request (FormData):
- name: string
- email: string
- password: string
- roleName: string ('Admin' | 'User' | 'Moderator')
- profilePicture: File (optional)

Response (Success):
{
  "message": "User registered successfully!",
  "user": {
    "id": "objId",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": "http://localhost:5000/uploads/filename.jpg"
  }
}
```

### 2. Login
**POST** `/api/login`
```
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (Success):
{
  "message": "Login successful",
  "user": {
    "id": "objId",
    "name": "John Doe",
    "email": "john@example.com",
    "role": {
      "_id": "roleObjId",
      "name": "User"
    },
    "profilePicture": "http://localhost:5000/uploads/filename.jpg"
  }
}
```

### 3. Get Roles
**GET** `/api/roles`
```
Response:
[
  { "_id": "objId", "name": "Admin" },
  { "_id": "objId", "name": "User" },
  { "_id": "objId", "name": "Moderator" }
]
```

---

## File Upload Details

### Upload Configuration
- **Destination**: `auth-backend/uploads/`
- **Max Size**: 5MB
- **Allowed Formats**: JPG, PNG, GIF, WebP
- **Naming**: `{timestamp}-{randomNumber}.{extension}`

### Profile Picture Field
- Stored in User document as filename
- Full URL returned in API responses
- Accessible via HTTP at `/uploads/{filename}`

---

## Environment Setup

### Required Dependencies
```bash
npm install
# (Already included in package.json)
- mongoose: MongoDB ODM
- bcryptjs: Password hashing
- multer: File upload handling
- express: Web framework
- cors: Cross-origin requests
```

### MongoDB Connection
- Connection string via `.env` (MONGO_URI)
- Auto-creates roles on startup
- Auto-creates uploads directory

---

## Error Handling

### Validation Errors
- ✓ Missing required fields
- ✓ Email already exists
- ✓ Invalid role name (defaults to 'User')
- ✓ Passwords don't match (LoginSignup/Signup)

### File Upload Errors
- ✓ File size exceeds 5MB
- ✓ Invalid file type (non-image)
- ✓ Multer upload failures

### Server Errors
- ✓ MongoDB connection failures
- ✓ Password hashing failures
- ✓ File system errors

---

## Security Measures

### Password Security
- Bcrypt hashing with 10 salt rounds
- Never stored or transmitted in plain text
- Validated against strength requirements (LoginSignup/Signup)

### File Security
- MIME type validation
- Extension validation
- File size limits
- Isolated upload directory

### Database Security
- Email uniqueness enforced at schema level
- Role-based access control foundation
- Timestamps for audit trails

---

## Testing Checklist

- [ ] Create account with default role (User)
- [ ] Create account with custom role (Admin/Moderator)
- [ ] Upload profile picture (test various formats)
- [ ] Try uploading file >5MB (should fail)
- [ ] Try uploading non-image file (should fail)
- [ ] Login and verify role is populated
- [ ] Check profile picture URL in login response
- [ ] Verify roles appear in dropdown on signup
- [ ] Test duplicate email registration (should fail)
- [ ] Check uploaded files in `/uploads/` directory

---

## Future Enhancements

1. **Profile Update Endpoint**
   - Allow users to update profile picture
   - Change role information (admin only)

2. **Role Management**
   - Create new roles (admin)
   - Delete/update roles
   - Assign permissions to roles

3. **Image Processing**
   - Resize/compress uploaded images
   - Generate thumbnails
   - Image validation (dimensions, etc.)

4. **Security**
   - JWT token implementation
   - Refresh token mechanism
   - Rate limiting
   - Email verification

5. **Database**
   - Add user bio/profile fields
   - Track login history
   - Password change tracking

---

## Files Modified

✅ `auth-backend/server.js` - Main backend server
✅ `auth-backend/models/user.js` - User schema
✅ `auth-backend/models/Role.js` - Role schema
✅ `auth-backend/middleware/upload.js` - File upload configuration
✅ `login-signup/src/Component/signup.js` - Signup component
✅ `login-signup/src/Components/Signup.js` - Signup component
✅ `login-signup/src/LoginSignup/Signup.js` - Signup component
✅ `login-signup/src/LoginSignups/Signup.js` - Signup component

---

## Running the Application

### Backend
```bash
cd auth-backend
npm install  # if needed
npm start    # or nodemon server.js
```

### Frontend
```bash
cd login-signup
npm install  # if needed
npm start    # starts on http://localhost:3000
```

---

## Database Connection

Add to `.env` in `auth-backend/`:
```
MONGO_URI=mongodb://localhost:27017/login-signup
PORT=5000
NODE_ENV=development
```

---

**Implementation Date**: May 25, 2026
**Status**: ✅ Complete and Ready for Testing
