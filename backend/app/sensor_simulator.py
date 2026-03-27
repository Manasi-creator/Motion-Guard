"""
Simulated Sensor Data Generator for MotionGuard AI.
Simulates ESP32 streaming JSON sensor packets.
"""
import numpy as np
import time
import asyncio
from typing import Dict, Optional

class SensorSimulator:
    """Generates realistic simulated sensor telemetry data."""

    def __init__(self, patient_id: str = "8821", sampling_rate: int = 100):
        self.patient_id = patient_id
        self.sampling_rate = sampling_rate
        self.t = 0.0
        self.dt = 1.0 / sampling_rate
        self.mode = "normal"  # normal, tremor, fall, post_fall
        self.mode_counter = 0
        self.base_heart_rate = 72
        self._rng = np.random.default_rng(42)

    def set_mode(self, mode: str):
        """Set simulation mode: normal, tremor, fall, post_fall"""
        self.mode = mode
        self.mode_counter = 0

    def generate_sample(self) -> Dict:
        """Generate a single sensor data sample."""
        self.t += self.dt
        self.mode_counter += 1

        if self.mode == "normal":
            return self._generate_normal()
        elif self.mode == "tremor":
            sample = self._generate_tremor()
            if self.mode_counter > 500:  # 5 seconds
                self.mode = "normal"
            return sample
        elif self.mode == "fall":
            sample = self._generate_fall()
            if self.mode_counter > 200:
                self.mode = "post_fall"
                self.mode_counter = 0
            return sample
        elif self.mode == "post_fall":
            sample = self._generate_post_fall()
            if self.mode_counter > 300:
                self.mode = "normal"
            return sample
        else:
            return self._generate_normal()

    def _generate_normal(self) -> Dict:
        """Generate normal walking/resting data."""
        # Simulate gentle walking motion
        walk_freq = 1.8  # ~1.8 Hz walking frequency
        walk_amp = 0.15
        
        accel_x = walk_amp * np.sin(2 * np.pi * walk_freq * self.t) + self._rng.normal(0, 0.02)
        accel_y = walk_amp * 0.5 * np.cos(2 * np.pi * walk_freq * self.t) + self._rng.normal(0, 0.02)
        accel_z = 0.98 + walk_amp * 0.3 * np.sin(2 * np.pi * walk_freq * 2 * self.t) + self._rng.normal(0, 0.01)
        
        gyro_x = 0.5 * np.sin(2 * np.pi * walk_freq * self.t) + self._rng.normal(0, 0.1)
        gyro_y = 0.3 * np.cos(2 * np.pi * walk_freq * self.t) + self._rng.normal(0, 0.1)
        gyro_z = self._rng.normal(0, 0.05)
        
        hr = int(self.base_heart_rate + 3 * np.sin(2 * np.pi * 0.1 * self.t) + self._rng.normal(0, 1))
        
        return self._make_packet(accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, hr)

    def _generate_tremor(self) -> Dict:
        """Generate Parkinsonian tremor data (4-6 Hz)."""
        tremor_freq = 5.2 + self._rng.normal(0, 0.3)
        tremor_amp = 1.5 + 0.5 * np.sin(2 * np.pi * 0.2 * self.t)  # Modulated amplitude
        
        # Walk component + tremor
        walk_freq = 1.5
        accel_x = 0.1 * np.sin(2 * np.pi * walk_freq * self.t) + tremor_amp * np.sin(2 * np.pi * tremor_freq * self.t) + self._rng.normal(0, 0.05)
        accel_y = 0.05 * np.cos(2 * np.pi * walk_freq * self.t) + tremor_amp * 0.6 * np.cos(2 * np.pi * tremor_freq * self.t) + self._rng.normal(0, 0.05)
        accel_z = 0.98 + tremor_amp * 0.3 * np.sin(2 * np.pi * tremor_freq * self.t + np.pi/4) + self._rng.normal(0, 0.03)
        
        gyro_x = tremor_amp * 2 * np.sin(2 * np.pi * tremor_freq * self.t) + self._rng.normal(0, 0.2)
        gyro_y = tremor_amp * 1.5 * np.cos(2 * np.pi * tremor_freq * self.t) + self._rng.normal(0, 0.2)
        gyro_z = self._rng.normal(0, 0.1)
        
        hr = int(self.base_heart_rate + 10 + self._rng.normal(0, 3))
        
        return self._make_packet(accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, hr)

    def _generate_fall(self) -> Dict:
        """Generate fall event data."""
        phase = self.mode_counter
        
        if phase < 30:
            # Pre-fall stumble
            factor = phase / 30.0
            accel_x = factor * 2.0 * self._rng.normal(1, 0.3)
            accel_y = factor * 1.5 * self._rng.normal(0.5, 0.3)
            accel_z = 0.98 - factor * 0.5 + self._rng.normal(0, 0.1)
        elif phase < 60:
            # Impact
            impact_factor = 1.0 - (phase - 30) / 30.0
            accel_x = 3.5 * impact_factor + self._rng.normal(0, 0.3)
            accel_y = 2.8 * impact_factor + self._rng.normal(0, 0.3)
            accel_z = 0.3 + self._rng.normal(0, 0.2)
        else:
            # Post-impact lying
            accel_x = self._rng.normal(0.05, 0.02)
            accel_y = self._rng.normal(0.95, 0.02)
            accel_z = self._rng.normal(0.1, 0.02)
        
        gyro_x = self._rng.normal(0, 0.5 if phase < 60 else 0.05)
        gyro_y = self._rng.normal(0, 0.5 if phase < 60 else 0.05)
        gyro_z = self._rng.normal(0, 0.3 if phase < 60 else 0.02)
        
        hr = int(110 + self._rng.normal(0, 8))
        
        return self._make_packet(accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, hr)

    def _generate_post_fall(self) -> Dict:
        """Post-fall recovery data."""
        recovery = min(1.0, self.mode_counter / 300.0)
        
        accel_x = self._rng.normal(0.05 + recovery * 0.1, 0.02)
        accel_y = self._rng.normal(0.95 - recovery * 0.5, 0.03)
        accel_z = self._rng.normal(0.1 + recovery * 0.88, 0.02)
        
        gyro_x = self._rng.normal(0, 0.05)
        gyro_y = self._rng.normal(0, 0.05)
        gyro_z = self._rng.normal(0, 0.02)
        
        hr = int(100 - recovery * 25 + self._rng.normal(0, 3))
        
        return self._make_packet(accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, hr)

    def _make_packet(self, ax, ay, az, gx, gy, gz, hr) -> Dict:
        return {
            "patient_id": self.patient_id,
            "device_id": "ESP32-MG-001",
            "timestamp": time.time(),
            "accelerometer": {"x": round(float(ax), 4), "y": round(float(ay), 4), "z": round(float(az), 4)},
            "gyroscope": {"x": round(float(gx), 4), "y": round(float(gy), 4), "z": round(float(gz), 4)},
            "heart_rate": {"bpm": max(40, min(180, int(hr))), "spo2": round(95 + self._rng.uniform(0, 4), 1)},
        }


# Pre-built simulators for demo patients
simulators: Dict[str, SensorSimulator] = {}

def get_simulator(patient_id: str) -> SensorSimulator:
    if patient_id not in simulators:
        simulators[patient_id] = SensorSimulator(patient_id=patient_id)
    return simulators[patient_id]
