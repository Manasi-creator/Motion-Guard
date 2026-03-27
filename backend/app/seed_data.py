"""Seed data for demo mode."""
from datetime import datetime, timedelta
import random

DEMO_PATIENTS = [
    {
        "patient_id": "8821",
        "name": "Arthur Miller",
        "age": 72,
        "room": "Room 402",
        "unit": "Unit 402",
        "station": "Station B-12",
        "diagnosis": "Parkinson's Disease - Stage 2",
        "assigned_doctor": "Dr. Sarah Chen",
        "status": "Active",
        "admitted_date": "2023-09-15"
    },
    {
        "patient_id": "8829",
        "name": "Sarah Jenkins",
        "age": 68,
        "room": "Room 305",
        "unit": "Unit 402",
        "station": "Station B-12",
        "diagnosis": "Essential Tremor",
        "assigned_doctor": "Dr. Sarah Chen",
        "status": "Active",
        "admitted_date": "2023-10-01"
    },
    {
        "patient_id": "99210",
        "name": "John Doe",
        "age": 78,
        "room": "Room 201",
        "unit": "Unit 201",
        "station": "Station A-5",
        "diagnosis": "Post-Stroke Rehabilitation",
        "assigned_doctor": "Dr. Sarah Jenkins",
        "status": "Active",
        "admitted_date": "2023-08-20"
    },
    {
        "patient_id": "6829",
        "name": "Eleanor Vance",
        "age": 65,
        "room": "Room 118",
        "unit": "Unit 118",
        "station": "Station C-3",
        "diagnosis": "Parkinson's Disease - Stage 1",
        "assigned_doctor": "Dr. Miller",
        "status": "Active",
        "admitted_date": "2023-10-10"
    }
]

DEMO_MEDICATIONS = [
    {
        "patient_id": "8821",
        "drug_name": "Carbidopa-Levodopa",
        "dosage": "25-100 mg",
        "frequency": "3x Daily",
        "schedule": ["8am", "2pm", "8pm"],
        "efficacy": "High",
        "next_dose": "In 42m",
        "start_date": "2023-09-15"
    },
    {
        "patient_id": "8821",
        "drug_name": "Pramipexole",
        "dosage": "0.5 mg",
        "frequency": "2x Daily",
        "schedule": ["9am", "9pm"],
        "efficacy": "Moderate",
        "next_dose": "In 3h",
        "start_date": "2023-09-20"
    },
    {
        "patient_id": "8829",
        "drug_name": "Propranolol",
        "dosage": "40 mg",
        "frequency": "2x Daily",
        "schedule": ["8am", "8pm"],
        "efficacy": "High",
        "next_dose": "In 1h",
        "start_date": "2023-10-01"
    }
]

def generate_demo_alerts():
    now = datetime.now()
    return [
        {
            "patient_id": "8821",
            "patient_name": "Arthur Miller",
            "severity": "CRITICAL",
            "alert_type": "Fall Risk Detected",
            "message": "High fall risk detected based on gait analysis",
            "timestamp": (now - timedelta(hours=2)).strftime("%Y-%m-%d %I:%M %p"),
            "status": "Resolved",
            "action_taken": "Notification Sent",
            "room": "Room 402"
        },
        {
            "patient_id": "8821",
            "patient_name": "Arthur Miller",
            "severity": "WARNING",
            "alert_type": "Irregular Heart Rate",
            "message": "Heart rate variability outside normal range",
            "timestamp": (now - timedelta(hours=5)).strftime("%Y-%m-%d %I:%M %p"),
            "status": "Pending",
            "action_taken": None,
            "room": "Room 402"
        },
        {
            "patient_id": "99210",
            "patient_name": "John Miller",
            "severity": "CRITICAL",
            "alert_type": "Possible Fall Detected",
            "message": "Sudden acceleration spike detected - possible fall event",
            "timestamp": (now - timedelta(hours=3, minutes=36)).strftime("%Y-%m-%d %I:%M %p"),
            "status": "Resolved",
            "action_taken": "Nurse Dispatched",
            "room": "Room 402"
        },
        {
            "patient_id": "8829",
            "patient_name": "Elena Rossi",
            "severity": "WARNING",
            "alert_type": "Irregular Heart Rhythm",
            "message": "Sustained irregular heart rhythm pattern",
            "timestamp": (now - timedelta(hours=4, minutes=15)).strftime("%Y-%m-%d %I:%M %p"),
            "status": "Pending",
            "action_taken": None,
            "room": "Room 105"
        },
        {
            "patient_id": "8821",
            "patient_name": "Arthur Miller",
            "severity": "INFO",
            "alert_type": "Stability Drop",
            "message": "Stability score dropped below 60% threshold",
            "timestamp": (now - timedelta(hours=6)).strftime("%Y-%m-%d %I:%M %p"),
            "status": "Acknowledged",
            "action_taken": "User Acknowledged",
            "room": "Room 402"
        }
    ]

def generate_adherence_history(patient_id: str, days: int = 30):
    """Generate medication adherence calendar data."""
    history = []
    now = datetime.now()
    for i in range(days):
        date = (now - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
        rand = random.random()
        if rand > 0.93:
            status = "Missed"
        elif rand > 0.8:
            status = "Delayed"
        else:
            status = "Taken"
        history.append({"date": date, "status": status, "patient_id": patient_id})
    return history

DEMO_USERS = [
    {
        "email": "s.chen@stjude.medical",
        "name": "Dr. Sarah Chen",
        "role": "Doctor",
        "specialty": "Chief of Neurology",
        "institution": "St. Jude Medical Center",
        "clinical_id": "#MG-98233-CHEN",
        "timezone": "Pacific Time (PT)"
    },
    {
        "email": "k.lee@stjude.medical",
        "name": "Kevin Lee",
        "role": "Admin",
        "specialty": "Head Nurse",
        "institution": "St. Jude Medical Center"
    },
    {
        "email": "m.rodriguez@family.care",
        "name": "Maria Rodriguez",
        "role": "Viewer",
        "specialty": "Patient Guardian (Family)",
        "institution": None
    }
]

DEMO_EMERGENCY_CONTACTS = [
    {
        "name": "Michael Chen",
        "role": "ON-CALL PHYSICIAN",
        "initials": "MC",
        "phone": "+1-555-0123",
        "can_call": True,
        "can_sms": True
    },
    {
        "name": "Sarah Williams",
        "role": "CHARGE NURSE (WARD B)",
        "initials": "SW",
        "phone": "+1-555-0456",
        "can_call": True,
        "can_sms": True
    }
]
