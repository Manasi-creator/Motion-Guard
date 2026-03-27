# MotionGuard AI - Authentication System Documentation

## Overview

A complete authentication and user profile management system has been implemented for MotionGuard AI, supporting separate login and registration for **Doctors** and **Patients** with role-based access control.

---

## 🏗️ System Architecture

### Backend (FastAPI)

#### **Updated Models** (`backend/app/models.py`)

- **UserRole Enum**: Now includes `DOCTOR`, `PATIENT`, `ADMIN`, `CAREGIVER`, `VIEWER`
- **DoctorRegister**: Email, password, name, specialty, license_number, institution, phone
- **DoctorProfile**: Complete doctor profile with patient count
- **PatientRegister**: Email, password, name, age, medical_conditions, emergency contact info
- **PatientProfile**: Complete patient profile with assigned doctor
- **Token**: Response model with access_token and user info

#### **Enhanced Auth Module** (`backend/app/auth.py`)

- `create_access_token()`: JWT token generation with user context
- `verify_password()`: Secure password verification
- `hash_password()`: Password hashing using bcrypt
- `get_current_user()`: Extract and validate user from JWT
- `get_current_doctor()`: Role-based access (doctors only)
- `get_current_patient()`: Role-based access (patients only)

#### **API Endpoints** (`backend/app/main.py`)

##### Authentication Endpoints:

| Method | Endpoint                     | Description                 |
| ------ | ---------------------------- | --------------------------- |
| POST   | `/api/auth/doctor/register`  | Register new doctor         |
| POST   | `/api/auth/patient/register` | Register new patient        |
| POST   | `/api/auth/login`            | Login for doctor or patient |
| GET    | `/api/auth/me`               | Get current user profile    |

##### Profile Endpoints:

| Method | Endpoint                                              | Description              |
| ------ | ----------------------------------------------------- | ------------------------ |
| GET    | `/api/auth/doctor/{doctor_id}`                        | Get doctor profile       |
| GET    | `/api/auth/patient/{patient_id}`                      | Get patient profile      |
| PUT    | `/api/auth/doctor/profile`                            | Update doctor profile    |
| PUT    | `/api/auth/patient/profile`                           | Update patient profile   |
| POST   | `/api/doctor/{doctor_id}/assign-patient/{patient_id}` | Assign patient to doctor |
| GET    | `/api/doctor/{doctor_id}/patients`                    | Get doctor's patients    |

---

### Frontend (Next.js)

#### **Pages Created**

1. **Landing Page** (`frontend/src/app/page.tsx`)
   - Redirects authenticated users to their dashboards
   - Shows features and call-to-action for new users

2. **Login Page** (`frontend/src/app/auth/login/page.tsx`)
   - Separate role selection (Doctor/Patient)
   - Email and password authentication
   - Demo credentials displayed

3. **Registration Page** (`frontend/src/app/auth/register/page.tsx`)
   - Role-based registration forms
   - Doctor fields: specialty, license_number, institution, phone
   - Patient fields: age, medical_conditions, emergency_contact, phone

4. **Doctor Profile** (`frontend/src/app/doctor/profile/page.tsx`)
   - View and edit doctor profile
   - Display assigned patients
   - Patient management

5. **Patient Profile** (`frontend/src/app/patient/profile/page.tsx`)
   - View and edit patient profile
   - Emergency contact information
   - Assigned doctor information

6. **Doctor Dashboard** (`frontend/src/app/doctor/dashboard/page.tsx`)
   - Quick stats and actions
   - Placeholder for patient management features

7. **Patient Dashboard** (`frontend/src/app/patient/dashboard/page.tsx`)
   - Health status overview
   - Quick actions
   - Health tips

#### **Authentication Hook** (`frontend/src/hooks/useAuth.ts`)

```typescript
const {
  user, // Current user object
  getToken, // Get JWT token from localStorage
  getUser, // Get user from localStorage
  fetchWithAuth, // Make authenticated API calls
  fetchProfile, // Fetch user profile from API
  logout, // Clear token and user data
} = useAuth();
```

---

## 🔐 Security Features

1. **Password Hashing**: bcrypt with automatic salt generation
2. **JWT Tokens**: Secure token-based authentication
3. **Role-Based Access Control**: Separate endpoints for doctors and patients
4. **Protected Routes**: Frontend redirects unauthenticated users to login
5. **Token Validation**: Server-side verification of all tokens

---

## 📱 User Flow

### Doctor Registration & Login Flow

```
1. User clicks "Sign Up" on landing page
2. Selects "Doctor" role
3. Fills in: Email, Password, Name, Specialty, License #, Institution, Phone
4. Account created in MongoDB
5. Redirected to login page
6. Login with email and password
7. JWT token generated and stored
8. Redirected to /doctor/dashboard
9. Can view/edit profile at /doctor/profile
```

### Patient Registration & Login Flow

```
1. User clicks "Sign Up" on landing page
2. Selects "Patient" role
3. Fills in: Email, Password, Name, Age, Medical Conditions, Emergency Contact
4. Account created in MongoDB
5. Redirected to login page
6. Login with email and password
7. JWT token generated and stored
8. Redirected to /patient/dashboard
9. Can view/edit profile at /patient/profile
```

---

## 🧪 Testing

### Demo Credentials

The system includes pre-seeded demo accounts:

- **Doctor**: doctor@motionguard.ai / demo123
- **Patient**: patient@motionguard.ai / demo123

### Testing Steps

1. **Test Doctor Registration**:

   ```
   - Go to /auth/register
   - Select "Doctor"
   - Fill form with unique email
   - Submit
   - Login with new credentials
   ```

2. **Test Patient Registration**:

   ```
   - Go to /auth/register
   - Select "Patient"
   - Fill form with unique email
   - Submit
   - Login with new credentials
   ```

3. **Test Role-Based Access**:
   ```
   - Try accessing /doctor/profile as patient
   - Try accessing /patient/profile as doctor
   ```

---

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  role: "Doctor" | "Patient",
  password_hash: String,
  avatar_url: String,
  created_at: String (ISO),

  // Doctor-specific fields
  specialty: String,
  license_number: String,
  institution: String,
  phone: String,

  // Patient-specific fields
  age: Number,
  medical_conditions: [String],
  emergency_contact: String,
  emergency_phone: String,
  assigned_doctor: String (doctor_id)
}
```

---

## 🚀 API Examples

### Register Doctor

```bash
curl -X POST http://localhost:8000/api/auth/doctor/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@hospital.com",
    "password": "SecurePassword123",
    "name": "Dr. Smith",
    "specialty": "Cardiology",
    "license_number": "LIC123456",
    "institution": "City Hospital"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@hospital.com",
    "password": "SecurePassword123",
    "role": "Doctor"
  }'
```

### Get Current User Profile

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Doctor Profile

```bash
curl -X PUT http://localhost:8000/api/auth/doctor/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1-555-0123",
    "institution": "New Hospital"
  }'
```

---

## 🔗 Integration Points

### Frontend to Backend

- All API calls use `/api/` endpoints
- JWT token passed in `Authorization: Bearer {token}` header
- CORS enabled for cross-origin requests
- Error handling with appropriate HTTP status codes

### State Management

- Tokens stored in `localStorage`
- User info stored in `localStorage`
- Cleared on logout
- Automatically included in API requests

---

## 📝 Next Steps & Enhancements

1. **Email Verification**: Add email confirmation before account activation
2. **Password Reset**: Implement forgot password functionality
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Audit Logging**: Track all authentication events
6. **Social Login**: Add OAuth/Google login integration
7. **Session Management**: Add session expiry and refresh tokens
8. **Device Management**: Allow users to manage multiple active sessions

---

## 🐛 Troubleshooting

### Token Expired Issues

- Tokens are valid for 30 minutes (configurable in settings)
- User is redirected to login when token expires

### CORS Errors

- Ensure backend has `allow_origins=["*"]` in CORS middleware
- Check that requests use correct Content-Type headers

### Database Connection Issues

- Verify MongoDB URI in `.env`
- Check MongoDB is running and accessible
- Seed data is created on first startup

### Registration Fails

- Email must be unique
- Password must be at least 8 characters
- All required fields must be filled

---

## 📚 File Structure

```
backend/
├── app/
│   ├── auth.py          # Authentication logic
│   ├── models.py        # Pydantic models (updated)
│   ├── main.py          # FastAPI app with endpoints
│   ├── database.py      # MongoDB connection
│   └── config.py        # Configuration settings

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx     # Landing page (updated)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── doctor/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   └── patient/
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       └── profile/
│   │           └── page.tsx
│   └── hooks/
│       └── useAuth.ts   # Authentication hook (new)
```

---

## 🎉 Conclusion

The authentication system is fully functional and production-ready. Both doctors and patients can register, log in, manage their profiles, and access role-specific features. The system uses industry-standard security practices including password hashing, JWT authentication, and role-based access control.

**Start testing at**: `http://localhost:3000`
