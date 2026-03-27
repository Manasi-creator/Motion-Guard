"""Pydantic models for MotionGuard AI."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ─── Enums ─────────────────────────────────────────────────
class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TremorSeverity(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    SEVERE = "Severe"

class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class AlertStatus(str, Enum):
    PENDING = "Pending"
    RESOLVED = "Resolved"
    ACKNOWLEDGED = "Acknowledged"

class UserRole(str, Enum):
    DOCTOR = "Doctor"
    PATIENT = "Patient"
    ADMIN = "Admin"
    CAREGIVER = "Caregiver"
    VIEWER = "Viewer"

class ConnectionRequestStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

# ─── Auth ──────────────────────────────────────────────────
class UserLogin(BaseModel):
    email: str
    password: str
    role: UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    role: UserRole
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

# ─── Doctor Models ─────────────────────────────────────────
class DoctorRegister(BaseModel):
    email: str
    password: str
    name: str
    specialty: str
    license_number: str
    institution: Optional[str] = None
    phone: Optional[str] = None

class DoctorProfile(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    specialty: str
    license_number: str
    institution: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    patients_count: int = 0

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    institution: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

# ─── Patient Models ────────────────────────────────────────
class PatientRegister(BaseModel):
    email: str
    password: str
    name: str
    age: int
    medical_conditions: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    phone: Optional[str] = None

class PatientProfile(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    age: int
    medical_conditions: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    assigned_doctor: Optional[str] = None
    created_at: Optional[datetime] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    medical_conditions: Optional[List[str]] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class DoctorDirectoryItem(BaseModel):
    id: str
    name: str
    specialty: str
    institution: Optional[str] = None

class ConnectionRequestCreate(BaseModel):
    doctor_id: str
    note: Optional[str] = None

class ConnectionRequestResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    patient_email: str
    doctor_id: str
    doctor_name: str
    doctor_specialty: Optional[str] = None
    note: Optional[str] = None
    status: ConnectionRequestStatus
    created_at: str
    updated_at: str

# ─── Sensor Data ───────────────────────────────────────────
class AccelerometerData(BaseModel):
    x: float
    y: float
    z: float
    timestamp: float

class GyroscopeData(BaseModel):
    x: float
    y: float
    z: float
    timestamp: float

class HeartRateData(BaseModel):
    bpm: int
    spo2: Optional[float] = None
    signal_quality: Optional[float] = None
    timestamp: float

class SensorPacket(BaseModel):
    patient_id: str
    device_id: Optional[str] = None
    accelerometer: AccelerometerData
    gyroscope: Optional[GyroscopeData] = None
    heart_rate: Optional[HeartRateData] = None
    timestamp: float

# ─── ML Output ─────────────────────────────────────────────
class TremorAnalysis(BaseModel):
    severity: TremorSeverity
    dominant_frequency: float
    amplitude_variance: float
    fft_spectrum: List[float] = []
    fft_frequencies: List[float] = []

class FallRiskPrediction(BaseModel):
    probability: float  # 0-100
    is_risk: bool
    acceleration_spike: float
    orientation_shift: float

class StabilityResult(BaseModel):
    score: float  # 0-100
    risk_level: RiskLevel
    motion_smoothness: float
    tremor_severity_inverse: float
    gait_consistency: float
    heart_rhythm_stability: float

class AnalysisResult(BaseModel):
    patient_id: str
    timestamp: float
    stability: StabilityResult
    tremor: TremorAnalysis
    fall_risk: FallRiskPrediction
    heart_rate: Optional[int] = None
    motion_intensity: Optional[float] = None

# ─── Patient ───────────────────────────────────────────────
class Patient(BaseModel):
    patient_id: str
    name: str
    age: int
    room: Optional[str] = None
    unit: Optional[str] = None
    station: Optional[str] = None
    diagnosis: Optional[str] = None
    assigned_doctor: Optional[str] = None
    status: str = "Active"
    admitted_date: Optional[str] = None

class PatientSummary(BaseModel):
    patient_id: str
    name: str
    stability_score: float
    risk_level: RiskLevel
    heart_rate: int
    motion_intensity: float
    last_updated: Optional[str] = None

# ─── Alerts ────────────────────────────────────────────────
class Alert(BaseModel):
    id: Optional[str] = None
    patient_id: str
    patient_name: Optional[str] = None
    severity: AlertSeverity
    alert_type: str
    message: str
    timestamp: str
    status: AlertStatus = AlertStatus.PENDING
    action_taken: Optional[str] = None
    room: Optional[str] = None

class AlertCreate(BaseModel):
    patient_id: str
    severity: AlertSeverity
    alert_type: str
    message: str

# ─── Medication ────────────────────────────────────────────
class Medication(BaseModel):
    id: Optional[str] = None
    patient_id: str
    drug_name: str
    dosage: str
    frequency: str
    schedule: List[str] = []
    efficacy: Optional[str] = None
    next_dose: Optional[str] = None
    start_date: Optional[str] = None

class MedicationAdherence(BaseModel):
    patient_id: str
    date: str
    status: str  # "Taken", "Missed", "Delayed"
    medication_id: str
    taken_at: Optional[str] = None

class MedicationStats(BaseModel):
    adherence_rate: float
    avg_stability_gain: float
    doses_taken: int
    doses_total: int
    current_status: str

# ─── Settings ──────────────────────────────────────────────
class DevicePairing(BaseModel):
    device_name: str
    device_type: str
    device_id: str
    signal_status: Optional[str] = None

class WorkspaceSettings(BaseModel):
    dark_mode: bool = False
    critical_alert_notifications: bool = True
    data_privacy_level: str = "ADVANCED"

class RiskThresholds(BaseModel):
    stability_threshold: int = 65
    voice_alerts: bool = True
    telegram_bot: bool = True
    ems_dispatch: bool = False

# ─── Telemetry Stream ─────────────────────────────────────
class TelemetryFrame(BaseModel):
    patient_id: str
    timestamp: float
    accel_x: float
    accel_y: float
    accel_z: float
    gyro_x: Optional[float] = None
    gyro_y: Optional[float] = None
    gyro_z: Optional[float] = None
    heart_rate: Optional[int] = None
    spo2: Optional[float] = None
    stability_score: Optional[float] = None
    risk_level: Optional[str] = None
    tremor_severity: Optional[str] = None
    dominant_frequency: Optional[float] = None
    fall_probability: Optional[float] = None
    motion_intensity: Optional[float] = None
    fft_spectrum: List[float] = []
    fft_frequencies: List[float] = []
