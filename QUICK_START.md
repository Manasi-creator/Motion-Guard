# MotionGuard AI - Quick Start Guide for Authentication

## 🚀 Getting Started

### Backend Setup

1. **Install Dependencies**:

```bash
cd backend
pip install -r requirements.txt
```

2. **Start MongoDB** (if not running):

```bash
# Windows with MongoDB installed
mongod

# Or with Docker
docker-compose up -d
```

3. **Run Backend Server**:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

- Backend will be available at: `http://localhost:8000`
- API docs available at: `http://localhost:8000/docs`

### Frontend Setup

1. **Install Dependencies**:

```bash
cd frontend
npm install
```

2. **Run Development Server**:

```bash
npm run dev
```

- Frontend will be available at: `http://localhost:3000`

---

## 🧪 Quick Testing Guide

### Step 1: Create a Doctor Account

1. Go to: `http://localhost:3000`
2. Click **"Sign Up"** button
3. Select **"Doctor"** role
4. Fill in the form:
   - **Name**: Dr. John Doe
   - **Email**: doctor@example.com
   - **Password**: TestPassword123
   - **Specialty**: Neurology
   - **License Number**: MED123456
5. Click **"Create Doctor Account"**
6. You'll be redirected to login page
7. Login with your credentials

### Step 2: Access Doctor Dashboard

- After login, you'll see: `/doctor/dashboard`
- Click **"My Profile"** to view/edit profile
- See assigned patients in profile page

### Step 3: Create a Patient Account

1. Go to: `http://localhost:3000`
2. Click **"Sign Up"** button
3. Select **"Patient"** role
4. Fill in the form:
   - **Name**: Jane Smith
   - **Email**: patient@example.com
   - **Password**: TestPassword123
   - **Age**: 65
   - **Medical Conditions**: Diabetes, Hypertension (optional)
   - **Emergency Contact**: John Smith
   - **Emergency Phone**: (555) 123-4567
5. Click **"Create Patient Account"**
6. You'll be redirected to login page
7. Login with your credentials

### Step 4: Access Patient Dashboard

- After login, you'll see: `/patient/dashboard`
- Click **"My Profile"** to view/edit profile
- See health metrics and tips

### Step 5: Test Profile Editing

1. Go to **"My Profile"** page
2. Click **"Edit"** button
3. Change some information
4. Click **"Save Changes"**
5. Verify changes are persisted

### Step 6: Test Logout

1. Click **"Logout"** button in top right
2. You'll be redirected to home page
3. Navigate to `/doctor/dashboard` or `/patient/dashboard`
4. You'll be redirected to `/auth/login`

---

## 📋 Demo Credentials (Pre-seeded)

If you want to test with pre-existing accounts:

**Doctor Account**:

- Email: `doctor@motionguard.ai`
- Password: `demo123`

**Patient Account**:

- Email: `patient@motionguard.ai`
- Password: `demo123`

These accounts are automatically created when the backend starts for the first time.

---

## 🔧 Troubleshooting

### Port Already in Use

**Backend (Port 8000)**:

```bash
# Change to different port
python -m uvicorn app.main:app --reload --port 8001
```

**Frontend (Port 3000)**:

```bash
# Change to different port
npm run dev -- -p 3001
```

### MongoDB Connection Error

- Ensure MongoDB is running
- Check connection string in `backend/app/config.py`
- Default: `mongodb://localhost:27017`

### CORS Error

- Backend should have CORS enabled
- Check `app.add_middleware()` in `backend/app/main.py`
- Should allow `origins=["*"]`

### Token Issues

- Clear browser cache and localStorage: `localStorage.clear()`
- Try logging out and back in
- Tokens are valid for 30 minutes

---

## 🔗 Important URLs

| Page              | URL                                       |
| ----------------- | ----------------------------------------- |
| Landing Page      | `http://localhost:3000`                   |
| Login             | `http://localhost:3000/auth/login`        |
| Register          | `http://localhost:3000/auth/register`     |
| Doctor Dashboard  | `http://localhost:3000/doctor/dashboard`  |
| Doctor Profile    | `http://localhost:3000/doctor/profile`    |
| Patient Dashboard | `http://localhost:3000/patient/dashboard` |
| Patient Profile   | `http://localhost:3000/patient/profile`   |
| API Docs          | `http://localhost:8000/docs`              |

---

## 🧪 API Testing with cURL

### Register a New Doctor

```bash
curl -X POST http://localhost:8000/api/auth/doctor/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdoctor@example.com",
    "password": "SecurePass123",
    "name": "Dr. Jane Smith",
    "specialty": "Cardiology",
    "license_number": "CARD789",
    "institution": "Heart Hospital",
    "phone": "+1-555-2468"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdoctor@example.com",
    "password": "SecurePass123",
    "role": "Doctor"
  }'
```

**Response** (save the token):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "newdoctor@example.com",
    "name": "Dr. Jane Smith",
    "role": "Doctor",
    "created_at": "2024-03-21T10:30:00"
  }
}
```

### Get Current User Profile

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Features Implemented

✅ Doctor Registration with validation
✅ Patient Registration with validation  
✅ Role-based Login (Doctor/Patient)
✅ JWT Token Authentication
✅ Doctor Profile Management
✅ Patient Profile Management
✅ Profile Editing
✅ Protected Routes
✅ Logout functionality
✅ Password Hashing (bcrypt)
✅ Role-based Access Control
✅ Patient Assignment to Doctors

---

## 🚀 Next Development Steps

1. **Doctor-Patient Assignment**:
   - Add endpoint for doctors to add/remove patients
   - Add patient search functionality

2. **Real-time Monitoring**:
   - Connect patient monitoring to doctor dashboards
   - Implement WebSocket for real-time updates

3. **Notifications**:
   - Email confirmation on registration
   - Alert notifications for doctors
   - Patient health alerts

4. **Advanced Features**:
   - Multi-factor authentication
   - Create appointment scheduling
   - Medical records management
   - Integration with wearable devices

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **MongoDB Documentation**: https://docs.mongodb.com/
- **JWT Guide**: https://jwt.io/introduction
- **Tailwind CSS**: https://tailwindcss.com/

---

## ✅ Checklist for Testing

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] MongoDB is running and accessible
- [ ] Can register a doctor account
- [ ] Can register a patient account
- [ ] Can login with both accounts
- [ ] Can view/edit profiles
- [ ] Can logout
- [ ] Unauthorized users are redirected to login
- [ ] API endpoints are accessible via browser

---

## 🎉 You're Ready!

Your authentication system is now fully functional. Start testing by visiting `http://localhost:3000` in your browser!

For detailed API documentation, visit: `http://localhost:8000/docs`
