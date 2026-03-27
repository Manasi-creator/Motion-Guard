import serial
import requests
import json
import time

# Change 'COM3' to whatever port your Arduino is on
# Windows: COM3, COM4, etc. (check Arduino IDE bottom right)
# Mac/Linux: /dev/ttyUSB0 or /dev/ttyACM0
SERIAL_PORT = 'COM3'
BAUD_RATE = 115200
BACKEND_URL = 'http://localhost:8000'
PATIENT_ID = '8821'  # Change to your patient's ID

def parse_line(line):
    """Parses: AccX: 2140 | AccY: 3112 | TremorFreq: 2 Hz | Disease: Normal | BPM: 72 | SpO2: 98.0 % | Sound: 1"""
    try:
        data = {}
        parts = line.strip().split('|')
        for part in parts:
            if ':' in part:
                key, value = part.strip().split(':', 1)
                data[key.strip()] = value.strip()
        return data
    except Exception as e:
        return None

def send_to_backend(parsed_data, token):
    try:
        # Clean the strings into numbers
        bpm = parsed_data.get("BPM", "0")
        spo2 = parsed_data.get("SpO2", "0").replace(" %", "")
        tremor = parsed_data.get("TremorFreq", "0").replace(" Hz", "")

        payload = {
            "patient_id": PATIENT_ID,
            "accX": float(parsed_data.get("AccX", 0)),
            "accY": float(parsed_data.get("AccY", 0)),
            "tremorFreq": float(tremor),
            "disease": parsed_data.get("Disease", "Unknown"),
            "bpm": int(float(bpm)), # Handle heart rate
            "spo2": float(spo2),    # Handle oxygen
            "sound": int(parsed_data.get("Sound", 0)),
            "alert": "ALERT" in line or "EXTREME" in line
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BACKEND_URL}/api/sensor-data", 
            json=payload, 
            headers=headers,
            timeout=2
        )
        print(f"Sent Data! Status: {response.status_code} | BPM: {bpm} | SpO2: {spo2}")
    except Exception as e:
        print(f"Error sending to backend: {e}")

def get_token():
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "email": "demo.doctor@motionguard.ai",
        "password": "demo12345",
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