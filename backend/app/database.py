"""Database connection and setup for MongoDB."""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None

async def connect_to_database():
    global client, db
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5000,
    )
    db = client[settings.DATABASE_NAME]
    # Create indexes
    await db.patients.create_index("patient_id", unique=True)
    await db.alerts.create_index([("timestamp", -1)])
    await db.telemetry.create_index([("patient_id", 1), ("timestamp", -1)])
    await db.telemetry.create_index([("patient_id", 1), ("recorded_at", -1)])
    await db.medications.create_index("patient_id")
    await db.medication_adherence.create_index([("patient_id", 1), ("date", -1)])
    await db.users.create_index("email", unique=True)
    await db.connection_requests.create_index([("doctor_id", 1), ("status", 1), ("created_at", -1)])
    await db.connection_requests.create_index([("patient_id", 1), ("status", 1), ("created_at", -1)])
    print(f"Connected to MongoDB: {settings.DATABASE_NAME}")

async def close_database_connection():
    global client
    if client is not None:
        client.close()
        print("MongoDB connection closed")

def get_database():
    return db
