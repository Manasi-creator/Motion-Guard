"""
MotionGuard AI - FastAPI Backend Server
Real-time motion instability prediction system.
"""
import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_to_database, close_database_connection, get_database
from app.models import *
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, decode_token,
    get_current_user_optional, get_current_doctor, get_current_patient
)
from app.ml_engine import pipeline
from app.sensor_simulator import get_simulator
from app.seed_data import (
    DEMO_PATIENTS, DEMO_MEDICATIONS, DEMO_USERS,
    DEMO_EMERGENCY_CONTACTS, generate_demo_alerts, generate_adherence_history
)

# ─── App Setup ─────────────────────────────────────────────
app = FastAPI(
    title="MotionGuard AI",
    description="AI-powered wearable monitoring system for real-time motion instability prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str = "default"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "default"):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)

    async def broadcast(self, message: dict, channel: str = "default"):
        if channel in self.active_connections:
            dead = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead.append(connection)
            for d in dead:
                self.disconnect(d, channel)

manager = ConnectionManager()


def _safe_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


async def _persist_telemetry_frame(frame: dict):
    db = get_database()
    if db is None:
        return
    try:
        ts = _safe_float(frame.get("timestamp"), time.time())
        doc = {**frame, "recorded_at": datetime.fromtimestamp(ts)}
        await db.telemetry.insert_one(doc)
    except Exception:
        pass


async def _get_or_seed_adherence(db, patient_id: str, days: int = 30):
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=max(0, days - 1))

    records = await db.medication_adherence.find(
        {
            "patient_id": patient_id,
            "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()},
        },
        {"_id": 0},
    ).sort("date", 1).to_list(5000)

    if records:
        return records

    medications = await db.medications.find({"patient_id": patient_id}, {"_id": 0}).to_list(100)
    if not medications:
        return []

    seeded: List[dict] = []
    for day_offset in range(days):
        day = (start_date + timedelta(days=day_offset)).isoformat()
        for med in medications:
            schedule = med.get("schedule") or ["08:00"]
            for dose_idx, _ in enumerate(schedule):
                seed_val = abs(hash(f"{patient_id}-{day}-{med.get('drug_name','med')}-{dose_idx}")) % 100
                if seed_val < 8:
                    status = "Missed"
                elif seed_val < 20:
                    status = "Delayed"
                else:
                    status = "Taken"

                seeded.append(
                    {
                        "patient_id": patient_id,
                        "date": day,
                        "status": status,
                        "medication_id": f"{med.get('drug_name', 'med')}-{dose_idx}",
                        "taken_at": datetime.utcnow().isoformat() if status == "Taken" else None,
                    }
                )

    if seeded:
        await db.medication_adherence.insert_many(seeded)
    return seeded


async def _seed_baseline_telemetry(db, patient_ids: List[str], target_samples: int = 180):
    for patient_id in patient_ids:
        existing = await db.telemetry.count_documents({"patient_id": patient_id})
        earliest = await db.telemetry.find(
            {"patient_id": patient_id},
            {"recorded_at": 1, "_id": 0}
        ).sort("recorded_at", 1).limit(1).to_list(1)

        needs_backfill = False
        if earliest and isinstance(earliest[0].get("recorded_at"), datetime):
            span_days = (datetime.utcnow() - earliest[0]["recorded_at"]).days
            needs_backfill = span_days < 7

        if existing >= target_samples and not needs_backfill:
            continue

        to_generate = target_samples if needs_backfill else (target_samples - existing)
        sim = get_simulator(patient_id)
        historical_window_seconds = 14 * 24 * 60 * 60
        step_seconds = historical_window_seconds / max(1, to_generate)
        start_ts = time.time() - historical_window_seconds
        docs: List[dict] = []

        for idx in range(to_generate):
            sample = sim.generate_sample()
            pipeline.add_sample(
                patient_id=patient_id,
                accel_x=sample["accelerometer"]["x"],
                accel_y=sample["accelerometer"]["y"],
                accel_z=sample["accelerometer"]["z"],
                gyro_x=sample["gyroscope"]["x"],
                gyro_y=sample["gyroscope"]["y"],
                gyro_z=sample["gyroscope"]["z"],
                heart_rate=sample["heart_rate"]["bpm"],
            )
            analysis = pipeline.analyze(patient_id)

            ts = start_ts + (idx * step_seconds)
            docs.append(
                {
                    "type": "telemetry",
                    "patient_id": patient_id,
                    "timestamp": ts,
                    "accel_x": sample["accelerometer"]["x"],
                    "accel_y": sample["accelerometer"]["y"],
                    "accel_z": sample["accelerometer"]["z"],
                    "gyro_x": sample["gyroscope"]["x"],
                    "gyro_y": sample["gyroscope"]["y"],
                    "gyro_z": sample["gyroscope"]["z"],
                    "heart_rate": sample["heart_rate"]["bpm"],
                    "spo2": sample["heart_rate"]["spo2"],
                    "stability_score": analysis["stability"]["score"],
                    "risk_level": analysis["stability"]["risk_level"],
                    "tremor_severity": analysis["tremor"]["severity"],
                    "dominant_frequency": analysis["tremor"]["dominant_frequency"],
                    "fall_probability": analysis["fall_risk"]["probability"],
                    "motion_intensity": analysis["motion_intensity"],
                    "fft_spectrum": analysis["tremor"]["fft_spectrum"],
                    "fft_frequencies": analysis["tremor"]["fft_frequencies"],
                    "motion_smoothness": analysis["stability"]["motion_smoothness"],
                    "gait_consistency": analysis["stability"]["gait_consistency"],
                    "heart_rhythm_stability": analysis["stability"]["heart_rhythm_stability"],
                    "recorded_at": datetime.fromtimestamp(ts),
                }
            )

        if docs:
            await db.telemetry.insert_many(docs)


async def _ensure_required_runtime_data(db):
    patient_count = await db.patients.count_documents({})
    if patient_count == 0:
        await db.patients.insert_many(DEMO_PATIENTS)

    med_count = await db.medications.count_documents({})
    if med_count == 0:
        await db.medications.insert_many(DEMO_MEDICATIONS)

    alerts_count = await db.alerts.count_documents({})
    if alerts_count == 0:
        await db.alerts.insert_many(generate_demo_alerts())

    # Existing demo users from seed data (doctor/admin/viewer)
    existing_emails = {
        user.get("email")
        for user in await db.users.find({}, {"email": 1, "_id": 0}).to_list(1000)
        if user.get("email")
    }
    for user in DEMO_USERS:
        if user["email"] not in existing_emails:
            user_doc = {**user, "password_hash": hash_password("demo123")}
            await db.users.insert_one(user_doc)

    demo_doctor = await db.users.find_one({"email": "demo.doctor@motionguard.ai"})
    if not demo_doctor:
        doctor_doc = {
            "email": "demo.doctor@motionguard.ai",
            "name": "Dr. Demo Kumar",
            "role": "Doctor",
            "specialty": "Neurology",
            "license_number": "DEMO-DOC-001",
            "institution": "MotionGuard Demo Hospital",
            "phone": "+91-9000000001",
            "password_hash": hash_password("demo12345"),
            "avatar_url": None,
            "created_at": datetime.utcnow().isoformat(),
        }
        inserted = await db.users.insert_one(doctor_doc)
        doctor_id = str(inserted.inserted_id)
    else:
        doctor_id = str(demo_doctor["_id"])

    demo_patient = await db.users.find_one({"email": "demo.patient@motionguard.ai"})
    if not demo_patient:
        patient_doc = {
            "email": "demo.patient@motionguard.ai",
            "name": "Demo Patient Sharma",
            "role": "Patient",
            "age": 67,
            "medical_conditions": ["Parkinson's", "Hypertension"],
            "emergency_contact": "Rahul Sharma",
            "emergency_phone": "+91-9000000002",
            "phone": "+91-9000000003",
            "password_hash": hash_password("demo12345"),
            "avatar_url": None,
            "assigned_doctor": doctor_id,
            "created_at": datetime.utcnow().isoformat(),
        }
        await db.users.insert_one(patient_doc)
    elif not demo_patient.get("assigned_doctor"):
        await db.users.update_one(
            {"_id": demo_patient["_id"]},
            {"$set": {"assigned_doctor": doctor_id}}
        )

    patient_ids = [
        p["patient_id"]
        for p in await db.patients.find({}, {"patient_id": 1, "_id": 0}).to_list(1000)
        if p.get("patient_id")
    ]

    for pid in patient_ids:
        await _get_or_seed_adherence(db, pid, 30)

    await _seed_baseline_telemetry(db, patient_ids, 180)

# ─── Lifecycle ─────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        await connect_to_database()
        db = get_database()
        if db is not None:
            await _ensure_required_runtime_data(db)
            print("Runtime data bootstrap complete")
    except Exception as e:
        print(f"Warning: Could not connect to MongoDB: {e}")
        print("Running in demo mode without database persistence")

    # Start background telemetry generation
    asyncio.create_task(telemetry_broadcast_loop())

@app.on_event("shutdown")
async def shutdown():
    await close_database_connection()

# ─── Background Telemetry Loop ─────────────────────────────
async def telemetry_broadcast_loop():
    """Continuously generates and broadcasts simulated sensor data."""
    patient_ids = ["8821", "8829", "99210", "6829"]
    while True:
        for pid in patient_ids:
            sim = get_simulator(pid)
            sample = sim.generate_sample()

            # Feed into ML pipeline
            pipeline.add_sample(
                patient_id=pid,
                accel_x=sample["accelerometer"]["x"],
                accel_y=sample["accelerometer"]["y"],
                accel_z=sample["accelerometer"]["z"],
                gyro_x=sample["gyroscope"]["x"],
                gyro_y=sample["gyroscope"]["y"],
                gyro_z=sample["gyroscope"]["z"],
                heart_rate=sample["heart_rate"]["bpm"]
            )

            # Run analysis every 10th sample (10Hz analysis rate)
            analysis = pipeline.analyze(pid)

            telemetry_frame = {
                "type": "telemetry",
                "patient_id": pid,
                "timestamp": sample["timestamp"],
                "accel_x": sample["accelerometer"]["x"],
                "accel_y": sample["accelerometer"]["y"],
                "accel_z": sample["accelerometer"]["z"],
                "gyro_x": sample["gyroscope"]["x"],
                "gyro_y": sample["gyroscope"]["y"],
                "gyro_z": sample["gyroscope"]["z"],
                "heart_rate": sample["heart_rate"]["bpm"],
                "spo2": sample["heart_rate"]["spo2"],
                "stability_score": analysis["stability"]["score"],
                "risk_level": analysis["stability"]["risk_level"],
                "tremor_severity": analysis["tremor"]["severity"],
                "dominant_frequency": analysis["tremor"]["dominant_frequency"],
                "fall_probability": analysis["fall_risk"]["probability"],
                "motion_intensity": analysis["motion_intensity"],
                "fft_spectrum": analysis["tremor"]["fft_spectrum"],
                "fft_frequencies": analysis["tremor"]["fft_frequencies"],
                "motion_smoothness": analysis["stability"]["motion_smoothness"],
                "gait_consistency": analysis["stability"]["gait_consistency"],
                "heart_rhythm_stability": analysis["stability"]["heart_rhythm_stability"],
            }

            asyncio.create_task(_persist_telemetry_frame(telemetry_frame))

            await manager.broadcast(telemetry_frame, f"telemetry_{pid}")
            await manager.broadcast(telemetry_frame, "telemetry_all")

        await asyncio.sleep(0.1)  # 10Hz update rate

# ─── WebSocket Endpoints ───────────────────────────────────
@app.websocket("/ws/telemetry/{patient_id}")
async def websocket_telemetry(websocket: WebSocket, patient_id: str):
    await manager.connect(websocket, f"telemetry_{patient_id}")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming commands from frontend
            try:
                cmd = json.loads(data)
                if cmd.get("action") == "simulate_fall":
                    sim = get_simulator(patient_id)
                    sim.set_mode("fall")
                    pipeline.simulate_fall(patient_id)
                elif cmd.get("action") == "simulate_tremor":
                    sim = get_simulator(patient_id)
                    sim.set_mode("tremor")
                    pipeline.simulate_tremor_spike(patient_id)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"telemetry_{patient_id}")

@app.websocket("/ws/telemetry")
async def websocket_telemetry_all(websocket: WebSocket):
    await manager.connect(websocket, "telemetry_all")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "telemetry_all")

# ─── Auth Endpoints ────────────────────────────────────────
@app.post("/api/auth/doctor/register")
async def register_doctor(doctor: DoctorRegister):
    """Register a new doctor account."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": doctor.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create doctor record
    doctor_doc = {
        "email": doctor.email,
        "name": doctor.name,
        "role": "Doctor",
        "specialty": doctor.specialty,
        "license_number": doctor.license_number,
        "institution": doctor.institution,
        "phone": doctor.phone,
        "password_hash": hash_password(doctor.password),
        "avatar_url": None,
        "created_at": datetime.now().isoformat()
    }
    
    result = await db.users.insert_one(doctor_doc)
    doctor_doc["_id"] = str(result.inserted_id)
    
    return {
        "message": "Doctor registered successfully",
        "user_id": str(result.inserted_id),
        "email": doctor.email
    }

@app.post("/api/auth/patient/register")
async def register_patient(patient: PatientRegister):
    """Register a new patient account."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": patient.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create patient record
    patient_doc = {
        "email": patient.email,
        "name": patient.name,
        "role": "Patient",
        "age": patient.age,
        "medical_conditions": patient.medical_conditions or [],
        "emergency_contact": patient.emergency_contact,
        "emergency_phone": patient.emergency_phone,
        "phone": patient.phone,
        "password_hash": hash_password(patient.password),
        "avatar_url": None,
        "assigned_doctor": None,
        "created_at": datetime.now().isoformat()
    }
    
    result = await db.users.insert_one(patient_doc)
    
    return {
        "message": "Patient registered successfully",
        "user_id": str(result.inserted_id),
        "email": patient.email
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Login for both doctors and patients."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify role matches
    if user.get("role") != credentials.role:
        raise HTTPException(status_code=401, detail=f"This account is registered as {user.get('role')}, not {credentials.role}")
    
    # Create token
    token = create_access_token({
        "sub": user["email"],
        "user_id": str(user["_id"]),
        "role": user["role"],
        "name": user["name"]
    })
    
    # Prepare user response
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        role=user["role"],
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at")
    )
    
    return Token(access_token=token, user=user_response)

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user_optional)):
    """Get current user profile."""
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await db.users.find_one({"email": current_user.get("sub")})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] == "Doctor":
        patients_count = await db.users.count_documents({"assigned_doctor": str(user["_id"]), "role": "Patient"})
        return DoctorProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            specialty=user.get("specialty", ""),
            license_number=user.get("license_number", ""),
            institution=user.get("institution"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at"),
            patients_count=patients_count
        )
    else:
        return PatientProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            age=user.get("age", 0),
            medical_conditions=user.get("medical_conditions", []),
            emergency_contact=user.get("emergency_contact"),
            emergency_phone=user.get("emergency_phone"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            assigned_doctor=user.get("assigned_doctor"),
            created_at=user.get("created_at")
        )

@app.get("/api/auth/doctor/{doctor_id}")
async def get_doctor_profile(doctor_id: str):
    """Get doctor profile by ID."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(doctor_id), "role": "Doctor"})
        if not user:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        patients_count = await db.users.count_documents({"assigned_doctor": doctor_id, "role": "Patient"})
        
        return DoctorProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            specialty=user.get("specialty", ""),
            license_number=user.get("license_number", ""),
            institution=user.get("institution"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at"),
            patients_count=patients_count
        )
    except:
        raise HTTPException(status_code=404, detail="Doctor not found")

@app.get("/api/auth/patient/{patient_id}")
async def get_patient_profile(patient_id: str):
    """Get patient profile by ID."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(patient_id), "role": "Patient"})
        if not user:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        return PatientProfile(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            age=user.get("age", 0),
            medical_conditions=user.get("medical_conditions", []),
            emergency_contact=user.get("emergency_contact"),
            emergency_phone=user.get("emergency_phone"),
            phone=user.get("phone"),
            avatar_url=user.get("avatar_url"),
            assigned_doctor=user.get("assigned_doctor"),
            created_at=user.get("created_at")
        )
    except:
        raise HTTPException(status_code=404, detail="Patient not found")


def _connection_request_response(doc: dict) -> ConnectionRequestResponse:
    return ConnectionRequestResponse(
        id=str(doc["_id"]),
        patient_id=doc["patient_id"],
        patient_name=doc.get("patient_name", "Unknown Patient"),
        patient_email=doc.get("patient_email", ""),
        doctor_id=doc["doctor_id"],
        doctor_name=doc.get("doctor_name", "Unknown Doctor"),
        doctor_specialty=doc.get("doctor_specialty"),
        note=doc.get("note"),
        status=doc.get("status", ConnectionRequestStatus.PENDING),
        created_at=doc.get("created_at", datetime.utcnow().isoformat()),
        updated_at=doc.get("updated_at", datetime.utcnow().isoformat()),
    )


@app.get("/api/doctors/directory")
async def get_doctors_directory(current_user: dict = Depends(get_current_patient)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    doctors = await db.users.find(
        {"role": "Doctor"},
        {"_id": 1, "name": 1, "specialty": 1, "institution": 1}
    ).sort("name", 1).to_list(500)

    return [
        DoctorDirectoryItem(
            id=str(d["_id"]),
            name=d.get("name", "Unknown Doctor"),
            specialty=d.get("specialty", "General"),
            institution=d.get("institution")
        )
        for d in doctors
    ]


@app.post("/api/connections/request")
async def create_connection_request(
    payload: ConnectionRequestCreate,
    current_user: dict = Depends(get_current_patient)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from bson import ObjectId

    patient = await db.users.find_one({"email": current_user.get("sub"), "role": "Patient"})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if patient.get("assigned_doctor"):
        raise HTTPException(status_code=400, detail="Patient already connected to a doctor")

    try:
        doctor_obj_id = ObjectId(payload.doctor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid doctor ID")

    doctor = await db.users.find_one({"_id": doctor_obj_id, "role": "Doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    pending_existing = await db.connection_requests.find_one(
        {
            "patient_id": str(patient["_id"]),
            "doctor_id": payload.doctor_id,
            "status": ConnectionRequestStatus.PENDING
        }
    )
    if pending_existing:
        raise HTTPException(status_code=400, detail="A pending request already exists for this doctor")

    now_iso = datetime.utcnow().isoformat()
    doc = {
        "patient_id": str(patient["_id"]),
        "patient_name": patient.get("name", "Unknown Patient"),
        "patient_email": patient.get("email", ""),
        "doctor_id": payload.doctor_id,
        "doctor_name": doctor.get("name", "Unknown Doctor"),
        "doctor_specialty": doctor.get("specialty"),
        "note": payload.note,
        "status": ConnectionRequestStatus.PENDING,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    result = await db.connection_requests.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _connection_request_response(doc)


@app.get("/api/connections/patient/requests")
async def get_patient_connection_requests(current_user: dict = Depends(get_current_patient)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    patient = await db.users.find_one({"email": current_user.get("sub"), "role": "Patient"}, {"_id": 1})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    requests = await db.connection_requests.find(
        {"patient_id": str(patient["_id"])}
    ).sort("created_at", -1).to_list(200)

    return [_connection_request_response(doc) for doc in requests]


@app.get("/api/connections/doctor/requests")
async def get_doctor_connection_requests(
    status: Optional[ConnectionRequestStatus] = Query(None),
    current_user: dict = Depends(get_current_doctor)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    query = {"doctor_id": current_user.get("user_id")}
    if status is not None:
        query["status"] = status

    requests = await db.connection_requests.find(query).sort("created_at", -1).to_list(200)
    return [_connection_request_response(doc) for doc in requests]


@app.post("/api/connections/doctor/requests/{request_id}/approve")
async def approve_connection_request(
    request_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from bson import ObjectId

    try:
        request_obj_id = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    request_doc = await db.connection_requests.find_one({
        "_id": request_obj_id,
        "doctor_id": current_user.get("user_id")
    })
    if not request_doc:
        raise HTTPException(status_code=404, detail="Connection request not found")

    if request_doc.get("status") != ConnectionRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    patient_result = await db.users.update_one(
        {"_id": ObjectId(request_doc["patient_id"]), "role": "Patient", "assigned_doctor": None},
        {"$set": {"assigned_doctor": current_user.get("user_id")}}
    )
    if patient_result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Patient is already connected to another doctor")

    now_iso = datetime.utcnow().isoformat()
    await db.connection_requests.update_many(
        {
            "patient_id": request_doc["patient_id"],
            "status": ConnectionRequestStatus.PENDING
        },
        {"$set": {"status": ConnectionRequestStatus.REJECTED, "updated_at": now_iso}}
    )
    await db.connection_requests.update_one(
        {"_id": request_obj_id},
        {"$set": {"status": ConnectionRequestStatus.APPROVED, "updated_at": now_iso}}
    )

    updated_doc = await db.connection_requests.find_one({"_id": request_obj_id})
    return _connection_request_response(updated_doc)


@app.post("/api/connections/doctor/requests/{request_id}/reject")
async def reject_connection_request(
    request_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from bson import ObjectId

    try:
        request_obj_id = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    request_doc = await db.connection_requests.find_one({
        "_id": request_obj_id,
        "doctor_id": current_user.get("user_id")
    })
    if not request_doc:
        raise HTTPException(status_code=404, detail="Connection request not found")

    if request_doc.get("status") != ConnectionRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    await db.connection_requests.update_one(
        {"_id": request_obj_id},
        {"$set": {"status": ConnectionRequestStatus.REJECTED, "updated_at": datetime.utcnow().isoformat()}}
    )
    updated_doc = await db.connection_requests.find_one({"_id": request_obj_id})
    return _connection_request_response(updated_doc)

@app.put("/api/auth/doctor/profile")
async def update_doctor_profile(
    update: DoctorUpdate,
    current_user: dict = Depends(get_current_doctor)
):
    """Update doctor profile."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    result = await db.users.update_one(
        {"email": current_user.get("sub"), "role": "Doctor"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    user = await db.users.find_one({"email": current_user.get("sub")})
    patients_count = await db.users.count_documents({"assigned_doctor": str(user["_id"]), "role": "Patient"})
    
    return DoctorProfile(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        specialty=user.get("specialty", ""),
        license_number=user.get("license_number", ""),
        institution=user.get("institution"),
        phone=user.get("phone"),
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at"),
        patients_count=patients_count
    )

@app.put("/api/auth/patient/profile")
async def update_patient_profile(
    update: PatientUpdate,
    current_user: dict = Depends(get_current_patient)
):
    """Update patient profile."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    result = await db.users.update_one(
        {"email": current_user.get("sub"), "role": "Patient"},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    user = await db.users.find_one({"email": current_user.get("sub")})
    
    return PatientProfile(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        age=user.get("age", 0),
        medical_conditions=user.get("medical_conditions", []),
        emergency_contact=user.get("emergency_contact"),
        emergency_phone=user.get("emergency_phone"),
        phone=user.get("phone"),
        avatar_url=user.get("avatar_url"),
        assigned_doctor=user.get("assigned_doctor"),
        created_at=user.get("created_at")
    )

@app.post("/api/doctor/{doctor_id}/assign-patient/{patient_id}")
async def assign_patient_to_doctor(
    doctor_id: str,
    patient_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    """Assign a patient to a doctor."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    from bson import ObjectId
    
    # Verify the doctor is updating their own assignments
    if current_user.get("user_id") != doctor_id:
        raise HTTPException(status_code=403, detail="Cannot assign patients to other doctors")
    
    # Update patient's assigned doctor
    result = await db.users.update_one(
        {"_id": ObjectId(patient_id), "role": "Patient"},
        {"$set": {"assigned_doctor": doctor_id}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": "Patient assigned successfully"}

@app.get("/api/doctor/{doctor_id}/patients")
async def get_doctor_patients(
    doctor_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    """Get all patients assigned to a doctor."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    # Verify the doctor is viewing their own patients
    if current_user.get("user_id") != doctor_id:
        raise HTTPException(status_code=403, detail="Cannot view other doctors' patients")
    
    patients = await db.users.find(
        {"assigned_doctor": doctor_id, "role": "Patient"},
        {"password_hash": 0}
    ).to_list(None)
    
    return [
        PatientProfile(
            id=str(p["_id"]),
            email=p["email"],
            name=p["name"],
            age=p.get("age", 0),
            medical_conditions=p.get("medical_conditions", []),
            emergency_contact=p.get("emergency_contact"),
            emergency_phone=p.get("emergency_phone"),
            phone=p.get("phone"),
            avatar_url=p.get("avatar_url"),
            assigned_doctor=p.get("assigned_doctor"),
            created_at=p.get("created_at")
        )
        for p in patients
    ]


@app.get("/api/doctor/{doctor_id}/patients/{patient_id}")
async def get_doctor_patient_details(
    doctor_id: str,
    patient_id: str,
    current_user: dict = Depends(get_current_doctor)
):
    """Get full profile details for one patient assigned to the doctor."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from bson import ObjectId

    if current_user.get("user_id") != doctor_id:
        raise HTTPException(status_code=403, detail="Cannot view other doctors' patients")

    try:
        patient_obj_id = ObjectId(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    patient = await db.users.find_one(
        {"_id": patient_obj_id, "role": "Patient", "assigned_doctor": doctor_id},
        {"password_hash": 0}
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to this doctor")

    return PatientProfile(
        id=str(patient["_id"]),
        email=patient["email"],
        name=patient["name"],
        age=patient.get("age", 0),
        medical_conditions=patient.get("medical_conditions", []),
        emergency_contact=patient.get("emergency_contact"),
        emergency_phone=patient.get("emergency_phone"),
        phone=patient.get("phone"),
        avatar_url=patient.get("avatar_url"),
        assigned_doctor=patient.get("assigned_doctor"),
        created_at=patient.get("created_at")
    )

# ─── Patient Endpoints ─────────────────────────────────────
@app.get("/api/patients")
async def get_patients():
    db = get_database()
    if db is not None:
        patients = await db.patients.find({}, {"_id": 0}).to_list(100)
        return patients
    return DEMO_PATIENTS

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    db = get_database()
    if db is not None:
        patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
        if patient:
            return patient
    for p in DEMO_PATIENTS:
        if p["patient_id"] == patient_id:
            return p
    raise HTTPException(status_code=404, detail="Patient not found")

@app.get("/api/patients/{patient_id}/summary")
async def get_patient_summary(patient_id: str):
    analysis = pipeline.analyze(patient_id)
    db = get_database()
    patient = None
    if db is not None:
        patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    if patient is None:
        for p in DEMO_PATIENTS:
            if p["patient_id"] == patient_id:
                patient = p
                break
    return {
        "patient_id": patient_id,
        "name": patient["name"] if patient else "Unknown",
        "stability_score": analysis["stability"]["score"],
        "risk_level": analysis["stability"]["risk_level"],
        "heart_rate": analysis["heart_rate"],
        "motion_intensity": analysis["motion_intensity"],
        "tremor_severity": analysis["tremor"]["severity"],
        "dominant_frequency": analysis["tremor"]["dominant_frequency"],
        "fall_probability": analysis["fall_risk"]["probability"],
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/patients/{patient_id}/analysis")
async def get_patient_analysis(patient_id: str):
    return pipeline.analyze(patient_id)

# ─── Alert Endpoints ───────────────────────────────────────
@app.get("/api/alerts")
async def get_alerts(patient_id: Optional[str] = None):
    db = get_database()
    if db is not None:
        query = {"patient_id": patient_id} if patient_id else {}
        alerts = await db.alerts.find(query, {"_id": 0}).sort("timestamp", -1).to_list(100)
        return alerts
    return generate_demo_alerts()

@app.post("/api/alerts")
async def create_alert(alert: AlertCreate):
    alert_doc = {
        "patient_id": alert.patient_id,
        "severity": alert.severity,
        "alert_type": alert.alert_type,
        "message": alert.message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending",
        "action_taken": None
    }
    db = get_database()
    if db is not None:
        await db.alerts.insert_one(alert_doc)
    # Broadcast alert
    await manager.broadcast({"type": "alert", **alert_doc}, "telemetry_all")
    return alert_doc

@app.post("/api/alerts/manual-emergency")
async def manual_emergency(patient_id: str = "8821"):
    alert_doc = {
        "patient_id": patient_id,
        "severity": "CRITICAL",
        "alert_type": "Manual Emergency Trigger",
        "message": "Emergency manually triggered by clinical staff",
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending",
        "action_taken": None
    }
    db = get_database()
    if db is not None:
        await db.alerts.insert_one(alert_doc)
    await manager.broadcast({"type": "alert", **alert_doc}, "telemetry_all")
    return alert_doc

@app.get("/api/alerts/thresholds")
async def get_thresholds():
    return {
        "stability_threshold": 65,
        "voice_alerts": True,
        "telegram_bot": True,
        "ems_dispatch": False
    }

@app.put("/api/alerts/thresholds")
async def update_thresholds(thresholds: RiskThresholds):
    return thresholds.dict()

# ─── Medication Endpoints ──────────────────────────────────
@app.get("/api/medications")
async def get_medications(patient_id: Optional[str] = None):
    db = get_database()
    if db is not None:
        query = {"patient_id": patient_id} if patient_id else {}
        meds = await db.medications.find(query, {"_id": 0}).to_list(100)
        return meds
    if patient_id:
        return [m for m in DEMO_MEDICATIONS if m["patient_id"] == patient_id]
    return DEMO_MEDICATIONS

@app.get("/api/medications/{patient_id}/stats")
async def get_medication_stats(patient_id: str):
    db = get_database()
    if db is None:
        adherence = generate_adherence_history(patient_id, 30)
        taken = sum(1 for a in adherence if a["status"] == "Taken")
        total = len(adherence)
        return {
            "adherence_rate": round(taken / total * 100, 1) if total > 0 else 0,
            "avg_stability_gain": 0.0,
            "doses_taken": taken,
            "doses_total": total,
            "current_status": "Unknown"
        }

    adherence = await _get_or_seed_adherence(db, patient_id, 30)
    taken = sum(1 for a in adherence if a.get("status") == "Taken")
    total = len(adherence)
    adherence_rate = round(taken / total * 100, 1) if total > 0 else 0

    telemetry_points = await db.telemetry.find(
        {"patient_id": patient_id},
        {"stability_score": 1, "recorded_at": 1, "_id": 0}
    ).sort("recorded_at", 1).limit(2000).to_list(2000)

    avg_stability_gain = 0.0
    if len(telemetry_points) >= 20:
        mid = len(telemetry_points) // 2
        first_half = telemetry_points[:mid]
        second_half = telemetry_points[mid:]
        first_avg = sum(_safe_float(x.get("stability_score"), 0.0) for x in first_half) / max(1, len(first_half))
        second_avg = sum(_safe_float(x.get("stability_score"), 0.0) for x in second_half) / max(1, len(second_half))
        avg_stability_gain = round(second_avg - first_avg, 2)

    if adherence_rate >= 90:
        current_status = "Optimal Stability"
    elif adherence_rate >= 75:
        current_status = "Stable"
    else:
        current_status = "Needs Attention"

    return {
        "adherence_rate": adherence_rate,
        "avg_stability_gain": avg_stability_gain,
        "doses_taken": taken,
        "doses_total": total,
        "current_status": current_status
    }

@app.get("/api/medications/{patient_id}/adherence")
async def get_adherence(patient_id: str, days: int = 30):
    db = get_database()
    if db is None:
        return generate_adherence_history(patient_id, days)
    records = await _get_or_seed_adherence(db, patient_id, days)
    return sorted(records, key=lambda x: x.get("date", ""))

@app.post("/api/medications")
async def add_medication(med: Medication):
    db = get_database()
    if db is not None:
        await db.medications.insert_one(med.dict(exclude={"id"}))
    return {"message": "Medication added successfully"}

# ─── Analytics Endpoints ───────────────────────────────────
@app.get("/api/analytics/{patient_id}/stability-trend")
async def get_stability_trend(patient_id: str, period: str = "weeks"):
    db = get_database()
    horizon = 30 if period == "weeks" else 120
    start_at = datetime.utcnow() - timedelta(days=horizon)

    if db is None:
        return []

    records = await db.telemetry.find(
        {"patient_id": patient_id, "recorded_at": {"$gte": start_at}},
        {"recorded_at": 1, "stability_score": 1, "_id": 0}
    ).sort("recorded_at", 1).to_list(10000)

    by_day: Dict[str, List[float]] = {}
    for record in records:
        ts = record.get("recorded_at")
        if not isinstance(ts, datetime):
            continue
        day_key = ts.date().isoformat()
        by_day.setdefault(day_key, []).append(_safe_float(record.get("stability_score"), 0.0))

    day_keys = sorted(by_day.keys())
    trend = []
    for idx, day_key in enumerate(day_keys):
        vals = by_day[day_key]
        avg_score = round(sum(vals) / max(1, len(vals)), 1)
        trend.append({"day": idx, "score": avg_score, "label": day_key})
    return trend

@app.get("/api/analytics/{patient_id}/activity-breakdown")
async def get_activity_breakdown(patient_id: str):
    db = get_database()
    if db is None:
        return {"total_hours": 0, "breakdown": []}

    start_at = datetime.utcnow() - timedelta(hours=24)
    records = await db.telemetry.find(
        {"patient_id": patient_id, "recorded_at": {"$gte": start_at}},
        {"motion_intensity": 1, "tremor_severity": 1, "_id": 0}
    ).to_list(20000)

    if not records:
        return {
            "total_hours": 0,
            "breakdown": [
                {"activity": "Walking", "percentage": 0, "color": "#137fec"},
                {"activity": "Standing", "percentage": 0, "color": "#f59e0b"},
                {"activity": "Sitting", "percentage": 0, "color": "#9ca3af"},
                {"activity": "Tremors", "percentage": 0, "color": "#ef4444"}
            ]
        }

    buckets = {"Walking": 0, "Standing": 0, "Sitting": 0, "Tremors": 0}
    for record in records:
        intensity = _safe_float(record.get("motion_intensity"), 0.0)
        tremor = str(record.get("tremor_severity", "")).lower()
        if tremor in {"moderate", "severe"}:
            buckets["Tremors"] += 1
        if intensity >= 2.0:
            buckets["Walking"] += 1
        elif intensity >= 0.8:
            buckets["Standing"] += 1
        else:
            buckets["Sitting"] += 1

    total = sum(buckets.values()) or 1
    breakdown = [
        {"activity": "Walking", "percentage": round(buckets["Walking"] * 100 / total), "color": "#137fec"},
        {"activity": "Standing", "percentage": round(buckets["Standing"] * 100 / total), "color": "#f59e0b"},
        {"activity": "Sitting", "percentage": round(buckets["Sitting"] * 100 / total), "color": "#9ca3af"},
        {"activity": "Tremors", "percentage": round(buckets["Tremors"] * 100 / total), "color": "#ef4444"}
    ]

    return {
        "total_hours": round(len(records) / 36000, 2),
        "breakdown": breakdown
    }

@app.get("/api/analytics/{patient_id}/stats")
async def get_analytics_stats(patient_id: str):
    db = get_database()
    if db is None:
        return {
            "stability_index": {"value": 0, "change": 0},
            "avg_daily_walk": {"value": 0, "unit": "m", "change": 0},
            "tremor_events": {"value": 0, "change": 0},
            "fall_risk": {"value": "Unknown", "label": "No telemetry available"},
            "gait_symmetry": 0,
            "postural_sway": 0,
            "resting_tremor": "Unknown"
        }

    now = datetime.utcnow()
    current_start = now - timedelta(hours=24)
    previous_start = now - timedelta(hours=48)

    current = await db.telemetry.find(
        {"patient_id": patient_id, "recorded_at": {"$gte": current_start}},
        {"stability_score": 1, "fall_probability": 1, "gait_consistency": 1, "dominant_frequency": 1,
         "accel_x": 1, "accel_y": 1, "accel_z": 1, "tremor_severity": 1, "motion_intensity": 1, "_id": 0}
    ).to_list(30000)

    previous = await db.telemetry.find(
        {"patient_id": patient_id, "recorded_at": {"$gte": previous_start, "$lt": current_start}},
        {"stability_score": 1, "motion_intensity": 1, "tremor_severity": 1, "_id": 0}
    ).to_list(30000)

    def avg(values: List[float]) -> float:
        return sum(values) / max(1, len(values))

    cur_stability = avg([_safe_float(x.get("stability_score"), 0.0) for x in current]) if current else 0.0
    prev_stability = avg([_safe_float(x.get("stability_score"), 0.0) for x in previous]) if previous else 0.0
    stability_change = round(cur_stability - prev_stability, 2)

    cur_walk = sum(1 for x in current if _safe_float(x.get("motion_intensity"), 0.0) >= 2.0)
    prev_walk = sum(1 for x in previous if _safe_float(x.get("motion_intensity"), 0.0) >= 2.0)
    # Approximate distance per high-motion sample for now
    cur_walk_m = round(cur_walk * 0.04, 1)
    prev_walk_m = round(prev_walk * 0.04, 1)

    cur_tremor_events = sum(1 for x in current if str(x.get("tremor_severity", "")).lower() in {"moderate", "severe"})
    prev_tremor_events = sum(1 for x in previous if str(x.get("tremor_severity", "")).lower() in {"moderate", "severe"})

    fall_probability = avg([_safe_float(x.get("fall_probability"), 0.0) for x in current]) if current else 0.0
    if fall_probability >= 65:
        fall_risk_value = "High"
    elif fall_probability >= 35:
        fall_risk_value = "Medium"
    else:
        fall_risk_value = "Low"

    gait_symmetry = round(avg([_safe_float(x.get("gait_consistency"), 0.0) for x in current]), 2) if current else 0.0

    magnitudes = [
        (_safe_float(x.get("accel_x"), 0.0) ** 2 + _safe_float(x.get("accel_y"), 0.0) ** 2 + _safe_float(x.get("accel_z"), 0.0) ** 2) ** 0.5
        for x in current
    ]
    if len(magnitudes) > 1:
        m_avg = avg(magnitudes)
        variance = avg([(m - m_avg) ** 2 for m in magnitudes])
        postural_sway = round(variance ** 0.5, 4)
    else:
        postural_sway = 0.0

    dom_freq = avg([_safe_float(x.get("dominant_frequency"), 0.0) for x in current if x.get("dominant_frequency") is not None]) if current else 0.0
    if dom_freq >= 8:
        resting_tremor = "Severe"
    elif dom_freq >= 5:
        resting_tremor = "Moderate"
    elif dom_freq > 0:
        resting_tremor = "Mild"
    else:
        resting_tremor = "Unknown"

    return {
        "stability_index": {"value": round(cur_stability, 1), "change": stability_change},
        "avg_daily_walk": {"value": cur_walk_m, "unit": "m", "change": round(cur_walk_m - prev_walk_m, 1)},
        "tremor_events": {"value": cur_tremor_events, "change": cur_tremor_events - prev_tremor_events},
        "fall_risk": {"value": fall_risk_value, "label": "Computed from recent fall probability"},
        "gait_symmetry": gait_symmetry,
        "postural_sway": postural_sway,
        "resting_tremor": resting_tremor
    }

# ─── Sensor Config Endpoints ──────────────────────────────
@app.get("/api/sensors/status")
async def get_sensor_status():
    return {
        "sensors": [
            {
                "name": "MPU6050 (Motion)",
                "type": "Accelerometer",
                "device_id": "ESP32-MG-001",
                "status": "Connected",
                "latency": "4.2ms",
                "signal_strength": 3,
                "packet_loss": 0.02
            },
            {
                "name": "MAX30102 (OX)",
                "type": "Heart Rate",
                "device_id": "ESP32-MG-001",
                "status": "Connected",
                "latency": "6.1ms",
                "signal_strength": 4,
                "signal_label": "STRONG",
                "packet_loss": 0.01
            }
        ],
        "system": {
            "sampling_rate": "100Hz",
            "buffer_size": "5.0s",
            "packet_loss": "0.02%",
            "uptime": "14d 6h 22m"
        }
    }

# ─── Settings Endpoints ───────────────────────────────────
@app.get("/api/settings/devices")
async def get_paired_devices():
    return [
        {"device_name": "Patient-Watch-04", "device_type": "Wrist Sensor", "device_id": "ID: 4B22-X", "signal_status": "Signal: Good"},
        {"device_name": "Room-Hub-Beta", "device_type": "Motion Sensor", "device_id": "ID: 9VE1-Y", "signal_status": None}
    ]

@app.get("/api/settings/workspace")
async def get_workspace_settings():
    return {
        "dark_mode": False,
        "critical_alert_notifications": True,
        "data_privacy_level": "ADVANCED"
    }

@app.get("/api/settings/users")
async def get_users():
    return [
        {"name": "Kevin Lee", "role": "Head Nurse", "access_level": "Admin", "status": "Active"},
        {"name": "Maria Rodriguez", "role": "Patient Guardian (Family)", "access_level": "Viewer", "status": "Offline"},
        {"name": "James Doe", "role": "Caregiver", "access_level": "Viewer", "status": "Pending"}
    ]

@app.get("/api/emergency-contacts")
async def get_emergency_contacts():
    return DEMO_EMERGENCY_CONTACTS

# ─── Demo Simulation Endpoints ─────────────────────────────
@app.post("/api/simulate/fall/{patient_id}")
async def simulate_fall(patient_id: str):
    sim = get_simulator(patient_id)
    sim.set_mode("fall")
    pipeline.simulate_fall(patient_id)
    # Create alert
    alert_doc = {
        "type": "alert",
        "patient_id": patient_id,
        "severity": "CRITICAL",
        "alert_type": "Fall Detected (Simulated)",
        "message": f"Simulated fall event for patient {patient_id}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending"
    }
    await manager.broadcast(alert_doc, "telemetry_all")
    await manager.broadcast(alert_doc, f"telemetry_{patient_id}")
    return {"message": "Fall simulation triggered", "patient_id": patient_id}

@app.post("/api/simulate/tremor/{patient_id}")
async def simulate_tremor(patient_id: str):
    sim = get_simulator(patient_id)
    sim.set_mode("tremor")
    pipeline.simulate_tremor_spike(patient_id)
    alert_doc = {
        "type": "alert",
        "patient_id": patient_id,
        "severity": "WARNING",
        "alert_type": "Tremor Spike (Simulated)",
        "message": f"Simulated severe tremor for patient {patient_id}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "status": "Pending"
    }
    await manager.broadcast(alert_doc, "telemetry_all")
    await manager.broadcast(alert_doc, f"telemetry_{patient_id}")
    return {"message": "Tremor simulation triggered", "patient_id": patient_id}

# ─── Health Check ──────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "MotionGuard AI",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/sensor-data")
async def receive_sensor_data(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    data["timestamp"] = datetime.utcnow()
    await db.sensor_data.insert_one(data)
    
    # Trigger alert if needed
    if data.get("alert"):
        await db.alerts.insert_one({
            "patient_id": data["patient_id"],
            "severity": "CRITICAL",
            "alert_type": "Tremor Alert",
            "message": f"High tremor detected - {data.get('disease')} - {data.get('tremorFreq')} Hz",
            "timestamp": data["timestamp"],
            "status": "Pending"
        })
    
    return {"status": "ok"}

@app.get("/api/sensor-data/{patient_id}")
async def get_sensor_data(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    data = await db.sensor_data.find(
        {"patient_id": patient_id}
    ).sort("timestamp", -1).limit(50).to_list(50)
    for d in data:
        d["_id"] = str(d["_id"])
    return data