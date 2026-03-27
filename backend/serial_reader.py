import serial
import requests
import json
import time

# Change 'COM3' to whatever port your Arduino is on
# Windows: COM3, COM4, etc. (check Arduino IDE bottom right)
# Mac/Linux: /dev/ttyUSB0 or /dev/ttyACM0
SERIAL_PORT = 'COM3'
BAUD_RATE = 9600
BACKEND_URL = 'http://localhost:8000'
PATIENT_ID = '8821'  # Change to your patient's ID

def parse_line(line):
    """Parse: AccX: 2140 | AccY: 3112 | TremorFreq: 2 Hz | Disease: Parkinson's | IR: 0 | Finger: NO | Sound: 1"""
    try:
        data = {}
        parts = line.strip().split('|')
        for part in parts:
            if ':' in part:
                key, value = part.strip().split(':', 1)
                data[key.strip()] = value.strip()
        return data
    except:
        return None

def send_to_backend(parsed_data, token):
    try:
        payload = {
            "patient_id": PATIENT_ID,
            "accX": float(parsed_data.get("AccX", 0)),
            "accY": float(parsed_data.get("AccY", 0)),
            "tremorFreq": parsed_data.get("TremorFreq", "0 Hz").replace(" Hz", ""),
            "disease": parsed_data.get("Disease", "Unknown"),
            "ir": int(parsed_data.get("IR", 0)),
            "finger": parsed_data.get("Finger", "NO"),
            "sound": int(parsed_data.get("Sound", 0)),
            "alert": "ALERT" in line
        }
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BACKEND_URL}/api/sensor-data",
            json=payload,
            headers=headers
        )
        print(f"Sent: {response.status_code}")
    except Exception as e:
        print(f"Error sending: {e}")

def get_token():
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "email": "doctor@motionguard.ai",
        "password": "demo123",
        "role": "Doctor"
    })
    return response.json().get("access_token")

# Main loop
token = get_token()
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
print(f"Reading from {SERIAL_PORT}...")

while True:
    try:
        line = ser.readline().decode('utf-8', errors='ignore')
        if line.strip():
            print(line.strip())
            parsed = parse_line(line)
            if parsed:
                send_to_backend(parsed, token)
    except KeyboardInterrupt:
        print("Stopped.")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(1)