# MotionGuard AI

> **AI-Powered Wearable Monitoring System** for real-time motion instability prediction in neurological and elderly patients.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688) ![Python](https://img.shields.io/badge/Python-3.10+-3776AB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

MotionGuard AI is a full-stack clinical monitoring platform that uses machine learning to analyze real-time sensor telemetry (accelerometer, gyroscope, heart rate) from wearable devices. It provides:

- **Real-time tremor classification** using FFT spectral analysis
- **Fall risk prediction** with multi-factor weighted scoring
- **Composite stability index** combining motion, gait, and cardiac signals
- **Live WebSocket streaming** at 10 Hz with auto-reconnect
- **Clinical-grade dashboard** with 7 specialized views
- **AI Health Assistant** chat with simulated clinical Q&A
- **Demo mode** with simulate-fall and simulate-tremor buttons

---

## Tech Stack

| Layer         | Technology                                                                |
| ------------- | ------------------------------------------------------------------------- |
| **Frontend**  | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3.4, Recharts |
| **Backend**   | FastAPI, Python 3.10+, Uvicorn (ASGI)                                     |
| **ML Engine** | scikit-learn (RandomForest, GradientBoosting), SciPy FFT, NumPy           |
| **Database**  | MongoDB (via Motor async driver)                                          |
| **Real-time** | WebSocket with channel-based broadcasting                                 |
| **Auth**      | JWT (python-jose) + bcrypt password hashing                               |

---

## Project Structure

```
MotionGuard AI/
├── backend/
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── __init__.py
│       ├── config.py          # Settings from .env
│       ├── database.py        # Async MongoDB connection
│       ├── models.py          # Pydantic models & enums
│       ├── ml_engine.py       # Tremor/Fall/Stability ML models
│       ├── sensor_simulator.py # Realistic sensor data generator
│       ├── auth.py            # JWT auth + password hashing
│       ├── seed_data.py       # Demo patients, meds, alerts
│       └── main.py            # FastAPI app, WebSocket, REST API
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout
        │   ├── globals.css         # Tailwind + custom styles
        │   ├── page.tsx            # Dashboard
        │   ├── live-monitor/       # Live monitoring view
        │   ├── alerts/             # Alert management
        │   ├── medication/         # Medication tracking
        │   ├── analytics/          # Mobility analytics
        │   ├── ai-summary/         # AI health narrative
        │   └── settings/           # System settings
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── Header.tsx
        │   ├── DashboardLayout.tsx
        │   └── ui/Cards.tsx
        ├── hooks/
        │   └── useTelemetry.ts     # WebSocket hook
        └── lib/
            └── utils.ts            # Helpers & API utilities
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** running on `localhost:27017` (or update `.env`)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### 3. Demo Mode

The application works in **full demo mode** without MongoDB. When the database is unavailable, the backend returns seeded demo data for 4 patients:

| Patient       | ID     | Condition            |
| ------------- | ------ | -------------------- |
| Arthur Miller | #8821  | Parkinson's Stage 2  |
| Sarah Jenkins | #8829  | Essential Tremor     |
| John Doe      | #99210 | Post-Stroke Recovery |
| Eleanor Vance | #6829  | Parkinson's Stage 3  |

---

## Pages

| Page             | Description                                                                           |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Dashboard**    | Real-time overview with stability ring, risk badge, ECG, motion charts, AI chat       |
| **Live Monitor** | 3-axis tremor chart, FFT spectrum, plethysmograph, sensor status                      |
| **Alerts**       | Response channels (voice/Telegram/EMS), thresholds, alert history, emergency contacts |
| **Medication**   | Adherence calendar, efficacy correlation, AI recommendations                          |
| **Analytics**    | Long-term stability trends, activity breakdown, instability heatmap, sensor fusion    |
| **AI Summary**   | Weekly AI narrative, stability prediction timeline, health Q&A chat                   |
| **Settings**     | Profile, device pairing, privacy level, user management, HIPAA compliance             |

---

## API Endpoints

### REST

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| POST   | `/api/auth/login`                   | JWT login                 |
| GET    | `/api/patients`                     | List all patients         |
| GET    | `/api/patients/{id}`                | Patient detail            |
| GET    | `/api/alerts`                       | Alert history             |
| GET    | `/api/medications/{patient_id}`     | Patient medications       |
| GET    | `/api/analytics/{patient_id}`       | Analytics data            |
| POST   | `/api/simulate/fall/{patient_id}`   | Trigger fall simulation   |
| POST   | `/api/simulate/tremor/{patient_id}` | Trigger tremor simulation |

### WebSocket

| Endpoint                                        | Description                  |
| ----------------------------------------------- | ---------------------------- |
| `ws://localhost:8000/ws/telemetry`              | All-patient telemetry stream |
| `ws://localhost:8000/ws/telemetry/{patient_id}` | Single-patient stream        |

---

## ML Models

### Tremor Classifier

- **Input:** Accelerometer XYZ time series
- **Method:** FFT with Hanning window → dominant frequency + band energy (3–12 Hz)
- **Output:** Severity (None / Low / Moderate / Severe), frequency, amplitude

### Fall Risk Predictor

- **Input:** Acceleration spikes, orientation angle, gait instability, heart rate
- **Method:** Weighted feature scoring with threshold classification
- **Output:** Risk probability (0–1), risk level

### Stability Engine

- **Input:** All sensor streams
- **Formula:** `0.4 × MotionSmoothness + 0.3 × TremorInverse + 0.2 × GaitConsistency + 0.1 × HeartRhythm`
- **Output:** Composite stability index (0–100), risk level

---

## Default Credentials

| Role   | Username    | Password          |
| ------ | ----------- | ----------------- |
| Doctor | `dr.chen`   | `motionguard2024` |
| Nurse  | `nurse.lee` | `motionguard2024` |
| Family | `maria.r`   | `motionguard2024` |

---

## License

MIT © 2024 MotionGuard AI

---

## Deployment (Vercel + Render)

Use this setup:

- **Frontend (Next.js):** Vercel
- **Backend (FastAPI):** Render
- **Database:** MongoDB Atlas

### 1) Deploy Backend on Render

You can use the included `render.yaml` (Blueprint) from repo root.

Required backend environment variables:

- `MONGODB_URL` = your Atlas connection string
- `SECRET_KEY` = long random string (JWT signing key)
- `DATABASE_NAME` = `motionguard_ai` (or your choice)
- `ALGORITHM` = `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` = `480`

Render start command is already configured as:

`uvicorn app.main:app --host 0.0.0.0 --port $PORT`

After deploy, copy your backend URL, for example:

`https://motionguard-ai-backend.onrender.com`

### 2) Deploy Frontend on Vercel

In Vercel:

1. Import this GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (no trailing slash)
   - `NEXT_PUBLIC_WS_URL` = backend websocket URL
     - if backend is `https://...onrender.com` then use `wss://...onrender.com`

Example:

- `NEXT_PUBLIC_API_URL=https://motionguard-ai-backend.onrender.com`
- `NEXT_PUBLIC_WS_URL=wss://motionguard-ai-backend.onrender.com`

The frontend proxies `/api/*` through `next.config.js` using `NEXT_PUBLIC_API_URL`.

### 3) CORS and Cookies

This backend currently allows broad CORS in app middleware, so frontend-to-backend calls from Vercel work out of the box.

### 4) Post-Deploy Check

- Open Vercel app URL.
- Register/Login as Doctor and Patient.
- Send patient connection request and approve from doctor profile.
- Verify telemetry and analytics pages load.
