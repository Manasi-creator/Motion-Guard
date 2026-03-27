# MotionGuard AI - Complete API Reference

## Base URL

```
http://localhost:8000
```

## API Documentation

Interactive API documentation available at: `http://localhost:8000/docs`

---

## Authentication Endpoints

### Register Doctor

**POST** `/api/auth/doctor/register`

**Request Body**:

```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePassword123",
  "name": "Dr. John Smith",
  "specialty": "Cardiology",
  "license_number": "MED123456",
  "institution": "City Hospital",
  "phone": "+1-555-0123"
}
```

**Response** (201):

```json
{
  "message": "Doctor registered successfully",
  "user_id": "507f1f77bcf86cd799439011",
  "email": "doctor@hospital.com"
}
```

---

### Register Patient

**POST** `/api/auth/patient/register`

**Request Body**:

```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123",
  "name": "Jane Doe",
  "age": 65,
  "medical_conditions": ["Diabetes", "Hypertension"],
  "emergency_contact": "John Doe",
  "emergency_phone": "+1-555-9876",
  "phone": "+1-555-5678"
}
```

**Response** (201):

```json
{
  "message": "Patient registered successfully",
  "user_id": "507f1f77bcf86cd799439012",
  "email": "patient@example.com"
}
```

---

### Login (Doctor or Patient)

**POST** `/api/auth/login`

**Request Body**:

```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePassword123",
  "role": "Doctor"
}
```

**Response** (200):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkb2N0b3JAaG9zcGl0YWwuY29tIiwicm9sZSI6IkRvY3RvciIsIm5hbWUiOiJEci4gSm9obiBTbWl0aCIsInVzZXJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJleHAiOjE3MTExNDEyMDB9.signature",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "doctor@hospital.com",
    "name": "Dr. John Smith",
    "role": "Doctor",
    "avatar_url": null,
    "created_at": "2024-03-21T10:30:00"
  }
}
```

**Error Response** (401):

```json
{
  "detail": "Invalid email or password"
}
```

**Error Response** (401 - Wrong Role):

```json
{
  "detail": "This account is registered as Patient, not Doctor"
}
```

---

### Get Current User Profile

**GET** `/api/auth/me`

**Headers**:

```
Authorization: Bearer {access_token}
```

**Response** (200 - Doctor):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "role": "Doctor",
  "specialty": "Cardiology",
  "license_number": "MED123456",
  "institution": "City Hospital",
  "phone": "+1-555-0123",
  "avatar_url": null,
  "created_at": "2024-03-21T10:30:00",
  "patients_count": 3
}
```

**Response** (200 - Patient):

```json
{
  "id": "507f1f77bcf86cd799439012",
  "email": "patient@example.com",
  "name": "Jane Doe",
  "role": "Patient",
  "age": 65,
  "medical_conditions": ["Diabetes", "Hypertension"],
  "emergency_contact": "John Doe",
  "emergency_phone": "+1-555-9876",
  "phone": "+1-555-5678",
  "avatar_url": null,
  "assigned_doctor": null,
  "created_at": "2024-03-21T11:00:00"
}
```

---

## Doctor Profile Endpoints

### Get Doctor Profile

**GET** `/api/auth/doctor/{doctor_id}`

**Response** (200):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith",
  "specialty": "Cardiology",
  "license_number": "MED123456",
  "institution": "City Hospital",
  "phone": "+1-555-0123",
  "avatar_url": null,
  "created_at": "2024-03-21T10:30:00",
  "patients_count": 3
}
```

---

### Update Doctor Profile

**PUT** `/api/auth/doctor/profile`

**Headers**:

```
Authorization: Bearer {access_token}
```

**Request Body** (all fields optional):

```json
{
  "name": "Dr. John Smith Jr.",
  "specialty": "Cardiology (Advanced)",
  "institution": "New Medical Center",
  "phone": "+1-555-9999",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response** (200):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "doctor@hospital.com",
  "name": "Dr. John Smith Jr.",
  "specialty": "Cardiology (Advanced)",
  "license_number": "MED123456",
  "institution": "New Medical Center",
  "phone": "+1-555-9999",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2024-03-21T10:30:00",
  "patients_count": 3
}
```

---

### Get Doctor's Patients

**GET** `/api/doctor/{doctor_id}/patients`

**Headers**:

```
Authorization: Bearer {access_token}
```

**Response** (200):

```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "email": "patient1@example.com",
    "name": "Jane Doe",
    "age": 65,
    "medical_conditions": ["Diabetes", "Hypertension"],
    "emergency_contact": "John Doe",
    "emergency_phone": "+1-555-9876",
    "phone": "+1-555-5678",
    "avatar_url": null,
    "assigned_doctor": "507f1f77bcf86cd799439011",
    "created_at": "2024-03-21T11:00:00"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "email": "patient2@example.com",
    "name": "Bob Smith",
    "age": 72,
    "medical_conditions": ["Parkinson's"],
    "emergency_contact": "Alice Smith",
    "emergency_phone": "+1-555-5432",
    "phone": "+1-555-4321",
    "avatar_url": null,
    "assigned_doctor": "507f1f77bcf86cd799439011",
    "created_at": "2024-03-21T12:00:00"
  }
]
```

---

### Assign Patient to Doctor

**POST** `/api/doctor/{doctor_id}/assign-patient/{patient_id}`

**Headers**:

```
Authorization: Bearer {access_token}
```

**Response** (200):

```json
{
  "message": "Patient assigned successfully"
}
```

---

## Patient Profile Endpoints

### Get Patient Profile

**GET** `/api/auth/patient/{patient_id}`

**Response** (200):

```json
{
  "id": "507f1f77bcf86cd799439012",
  "email": "patient@example.com",
  "name": "Jane Doe",
  "age": 65,
  "medical_conditions": ["Diabetes", "Hypertension"],
  "emergency_contact": "John Doe",
  "emergency_phone": "+1-555-9876",
  "phone": "+1-555-5678",
  "avatar_url": null,
  "assigned_doctor": null,
  "created_at": "2024-03-21T11:00:00"
}
```

---

### Update Patient Profile

**PUT** `/api/auth/patient/profile`

**Headers**:

```
Authorization: Bearer {access_token}
```

**Request Body** (all fields optional):

```json
{
  "name": "Jane Doe Jr.",
  "age": 66,
  "medical_conditions": ["Diabetes", "Hypertension", "Arthritis"],
  "emergency_contact": "John Doe Sr.",
  "emergency_phone": "+1-555-0000",
  "phone": "+1-555-1111",
  "avatar_url": "https://example.com/patient_avatar.jpg"
}
```

**Response** (200):

```json
{
  "id": "507f1f77bcf86cd799439012",
  "email": "patient@example.com",
  "name": "Jane Doe Jr.",
  "age": 66,
  "medical_conditions": ["Diabetes", "Hypertension", "Arthritis"],
  "emergency_contact": "John Doe Sr.",
  "emergency_phone": "+1-555-0000",
  "phone": "+1-555-1111",
  "avatar_url": "https://example.com/patient_avatar.jpg",
  "assigned_doctor": null,
  "created_at": "2024-03-21T11:00:00"
}
```

---

## Error Responses

### 400 Bad Request

**Email Already Registered**:

```json
{
  "detail": "Email already registered"
}
```

### 401 Unauthorized

**Missing Token**:

```json
{
  "detail": "Not authenticated"
}
```

**Invalid Token**:

```json
{
  "detail": "Invalid authentication token"
}
```

### 403 Forbidden

**Wrong Role**:

```json
{
  "detail": "Only doctors can access this resource"
}
```

### 404 Not Found

**User Not Found**:

```json
{
  "detail": "Doctor not found"
}
```

### 503 Service Unavailable

**Database Error**:

```json
{
  "detail": "Database unavailable"
}
```

---

## Authentication

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer {access_token}
```

### Token Structure

Tokens are JWT (JSON Web Tokens) containing:

- `sub`: User email
- `user_id`: MongoDB user ID
- `role`: User role (Doctor or Patient)
- `name`: User full name
- `exp`: Token expiration time

### Token Expiration

Tokens automatically expire after **30 minutes** by default.

---

## Status Codes Reference

| Code | Meaning                        |
| ---- | ------------------------------ |
| 200  | OK - Request successful        |
| 201  | Created - Resource created     |
| 400  | Bad Request - Invalid input    |
| 401  | Unauthorized - Auth failed     |
| 403  | Forbidden - Access denied      |
| 404  | Not Found - Resource not found |
| 503  | Unavailable - Service error    |

---

## Request/Response Examples

### Complete Doctor Registration Flow

**1. Register**:

```bash
curl -X POST http://localhost:8000/api/auth/doctor/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@hospital.com",
    "password": "SecurePass123",
    "name": "Dr. Smith",
    "specialty": "Neurology",
    "license_number": "NEU789",
    "institution": "Brain Hospital"
  }'
```

**2. Login**:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@hospital.com",
    "password": "SecurePass123",
    "role": "Doctor"
  }'
```

Response includes: `access_token`, `token_type`, `user`

**3. Get Profile**:

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Update Profile**:

```bash
curl -X PUT http://localhost:8000/api/auth/doctor/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1-555-1234"
  }'
```

---

## Field Validation

### Email

- Must be valid email format
- Must be unique in database
- Required

### Password

- Minimum 8 characters (enforced on frontend)
- No specific complexity requirements
- Hashed with bcrypt on backend

### Doctor Fields

- **Specialty**: Required, string
- **License Number**: Required, string (no format validation)
- **Institution**: Optional, string
- **Phone**: Optional, string

### Patient Fields

- **Age**: Required, integer (18-150 range recommended)
- **Medical Conditions**: Optional, array of strings
- **Emergency Contact**: Optional, string
- **Emergency Phone**: Optional, string

---

## Rate Limiting

Currently **no rate limiting** is enforced.
Recommended for production: Implement rate limiting to prevent abuse.

---

## CORS

**Allowed Origins**: All (`*`)
**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
**Allowed Headers**: Application/JSON, Authorization

---

## Pagination

Not currently implemented.
All endpoints return full data sets.

---

## Swagger/OpenAPI

Full interactive API documentation available at:

```
http://localhost:8000/docs
```

Alternative documentation (ReDoc):

```
http://localhost:8000/redoc
```

---

## Questions?

Refer to the implementation summary and quick start guides for more information.
