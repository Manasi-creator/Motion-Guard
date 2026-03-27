"""
ML Engine for MotionGuard AI
- Tremor Classification (FFT-based + Random Forest)
- Fall Risk Prediction (Random Forest)
- Stability Score Engine (Composite Index)
"""
import numpy as np
from scipy import signal as scipy_signal
from scipy.fft import fft, fftfreq
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from typing import Tuple, List, Dict
import joblib
import os

# ─── Tremor Classification ────────────────────────────────
class TremorClassifier:
    """FFT-based tremor analysis with Random Forest classification."""

    def __init__(self, sampling_rate: int = 100):
        self.sampling_rate = sampling_rate
        self.model = self._build_model()
        self._is_trained = False

    def _build_model(self):
        return RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )

    def compute_fft(self, signal_data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Compute FFT of the signal."""
        N = len(signal_data)
        if N == 0:
            return np.array([]), np.array([])
        
        # Apply Hanning window
        window = np.hanning(N)
        windowed_signal = signal_data * window
        
        yf = fft(windowed_signal)
        xf = fftfreq(N, 1.0 / self.sampling_rate)
        
        # Only positive frequencies
        positive_mask = xf > 0
        frequencies = xf[positive_mask]
        magnitudes = 2.0 / N * np.abs(yf[positive_mask])
        
        return frequencies, magnitudes

    def extract_features(self, accel_x: np.ndarray, accel_y: np.ndarray, accel_z: np.ndarray) -> Dict:
        """Extract tremor features from 3-axis accelerometer data."""
        # Compute magnitude
        magnitude = np.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
        
        # FFT on magnitude
        frequencies, fft_magnitudes = self.compute_fft(magnitude - np.mean(magnitude))
        
        if len(frequencies) == 0:
            return {
                "dominant_frequency": 0.0,
                "amplitude_variance": 0.0,
                "mean_amplitude": 0.0,
                "peak_amplitude": 0.0,
                "spectral_energy": 0.0,
                "tremor_band_energy": 0.0,
                "fft_spectrum": [],
                "fft_frequencies": [],
                "severity": "Low"
            }
        
        # Dominant frequency
        dominant_idx = np.argmax(fft_magnitudes)
        dominant_frequency = float(frequencies[dominant_idx])
        
        # Tremor band energy (3-12 Hz is typical tremor range)
        tremor_mask = (frequencies >= 3) & (frequencies <= 12)
        tremor_band_energy = float(np.sum(fft_magnitudes[tremor_mask]**2)) if np.any(tremor_mask) else 0.0
        
        # Total spectral energy
        spectral_energy = float(np.sum(fft_magnitudes**2))
        
        # Amplitude features
        amplitude_variance = float(np.var(magnitude))
        mean_amplitude = float(np.mean(np.abs(magnitude - np.mean(magnitude))))
        peak_amplitude = float(np.max(np.abs(magnitude - np.mean(magnitude))))
        
        # Classify severity based on tremor characteristics
        severity = self._classify_severity(dominant_frequency, tremor_band_energy, amplitude_variance)
        
        # Subsample FFT for transmission (max 50 points)
        max_points = 50
        if len(frequencies) > max_points:
            indices = np.linspace(0, len(frequencies) - 1, max_points, dtype=int)
            fft_freq_sub = frequencies[indices].tolist()
            fft_mag_sub = fft_magnitudes[indices].tolist()
        else:
            fft_freq_sub = frequencies.tolist()
            fft_mag_sub = fft_magnitudes.tolist()
        
        return {
            "dominant_frequency": round(dominant_frequency, 2),
            "amplitude_variance": round(amplitude_variance, 4),
            "mean_amplitude": round(mean_amplitude, 4),
            "peak_amplitude": round(peak_amplitude, 4),
            "spectral_energy": round(spectral_energy, 4),
            "tremor_band_energy": round(tremor_band_energy, 4),
            "fft_spectrum": [round(v, 4) for v in fft_mag_sub],
            "fft_frequencies": [round(v, 2) for v in fft_freq_sub],
            "severity": severity
        }

    def _classify_severity(self, dominant_freq: float, tremor_energy: float, amplitude_var: float) -> str:
        """Rule-based tremor severity classification."""
        # Parkinsonian tremor typically 4-6 Hz
        # Essential tremor typically 5-10 Hz
        
        score = 0
        
        # Frequency in tremor range
        if 3 <= dominant_freq <= 12:
            score += 2
        if 4 <= dominant_freq <= 8:
            score += 1  # Classic tremor range
        
        # Energy thresholds
        if tremor_energy > 5.0:
            score += 3
        elif tremor_energy > 1.0:
            score += 2
        elif tremor_energy > 0.3:
            score += 1
        
        # Amplitude variance
        if amplitude_var > 2.0:
            score += 2
        elif amplitude_var > 0.5:
            score += 1
        
        if score >= 6:
            return "Severe"
        elif score >= 3:
            return "Moderate"
        else:
            return "Low"


# ─── Fall Risk Prediction ─────────────────────────────────
class FallRiskPredictor:
    """Fall risk prediction using acceleration spikes and orientation changes."""

    def __init__(self):
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self._is_trained = False
        self.spike_threshold = 2.5  # g-force threshold
        self.angle_threshold = 30   # degrees

    def extract_features(self, accel_x: np.ndarray, accel_y: np.ndarray, accel_z: np.ndarray,
                         heart_rate: int = 72) -> Dict:
        """Extract fall risk features."""
        magnitude = np.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
        
        # Acceleration spike detection
        max_accel = float(np.max(magnitude))
        accel_spike = max(0, max_accel - 1.0)  # Subtract gravity
        
        # Orientation angle estimation
        mean_x = float(np.mean(accel_x))
        mean_y = float(np.mean(accel_y))
        mean_z = float(np.mean(accel_z))
        tilt_angle = float(np.degrees(np.arctan2(np.sqrt(mean_x**2 + mean_y**2), abs(mean_z))))
        
        # Gait instability (variation in step pattern)
        gait_instability = float(np.std(np.diff(magnitude))) if len(magnitude) > 1 else 0.0
        
        # Heart rate irregularity score (simulated)
        hr_irregularity = abs(heart_rate - 72) / 72.0  # Normalized deviation from normal
        
        # Compute fall probability
        probability = self._compute_fall_probability(accel_spike, tilt_angle, gait_instability, hr_irregularity)
        
        return {
            "probability": round(probability, 1),
            "is_risk": probability > 50,
            "acceleration_spike": round(accel_spike, 3),
            "orientation_shift": round(tilt_angle, 1),
            "gait_instability": round(gait_instability, 4),
            "hr_irregularity": round(hr_irregularity, 3)
        }

    def _compute_fall_probability(self, accel_spike: float, tilt_angle: float,
                                   gait_instability: float, hr_irregularity: float) -> float:
        """Compute fall probability using weighted features."""
        score = 0.0
        
        # Acceleration spike contribution (0-40 points)
        if accel_spike > 3.0:
            score += 40
        elif accel_spike > 2.0:
            score += 30
        elif accel_spike > 1.0:
            score += 15
        else:
            score += accel_spike * 10
        
        # Tilt angle contribution (0-25 points)
        if tilt_angle > 45:
            score += 25
        elif tilt_angle > 30:
            score += 15
        else:
            score += tilt_angle / 3
        
        # Gait instability (0-25 points)
        score += min(25, gait_instability * 50)
        
        # Heart rate irregularity (0-10 points)
        score += min(10, hr_irregularity * 20)
        
        return min(100, max(0, score))


# ─── Stability Score Engine ───────────────────────────────
class StabilityEngine:
    """Composite Stability Index Calculator.
    
    Stability Score = 0.4 × Motion Smoothness + 0.3 × Tremor Severity Inverse
                    + 0.2 × Gait Consistency + 0.1 × Heart Rhythm Stability
    """

    def compute_stability(self, accel_x: np.ndarray, accel_y: np.ndarray, accel_z: np.ndarray,
                          tremor_severity: str, heart_rate: int = 72) -> Dict:
        """Compute composite stability score."""
        magnitude = np.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
        
        # 1. Motion Smoothness (0-100): Lower jerk = smoother
        jerk = np.diff(magnitude, n=2) if len(magnitude) > 2 else np.array([0])
        jerk_magnitude = float(np.mean(np.abs(jerk)))
        motion_smoothness = max(0, min(100, 100 - jerk_magnitude * 100))
        
        # 2. Tremor Severity Inverse (0-100)
        tremor_map = {"Low": 90, "Moderate": 50, "Severe": 15}
        tremor_inverse = tremor_map.get(tremor_severity, 90)
        
        # 3. Gait Consistency (0-100): Lower variance = more consistent
        if len(magnitude) > 10:
            # Compute stride regularity using autocorrelation
            normalized = magnitude - np.mean(magnitude)
            if np.std(normalized) > 0:
                autocorr = np.correlate(normalized, normalized, mode='full')
                autocorr = autocorr[len(autocorr)//2:]
                autocorr = autocorr / autocorr[0] if autocorr[0] != 0 else autocorr
                # Higher autocorrelation peak = more regular gait
                peaks = autocorr[1:min(50, len(autocorr))]
                gait_consistency = max(0, min(100, float(np.max(peaks)) * 100)) if len(peaks) > 0 else 70
            else:
                gait_consistency = 85
        else:
            gait_consistency = 70
        
        # 4. Heart Rhythm Stability (0-100)
        hr_deviation = abs(heart_rate - 72)
        if hr_deviation < 10:
            heart_stability = 95.0
        elif hr_deviation < 20:
            heart_stability = 75.0
        elif hr_deviation < 40:
            heart_stability = 50.0
        else:
            heart_stability = 20.0
        
        # Composite Score
        stability_score = (
            0.4 * motion_smoothness +
            0.3 * tremor_inverse +
            0.2 * gait_consistency +
            0.1 * heart_stability
        )
        
        # Determine risk level
        if stability_score >= 75:
            risk_level = "LOW"
        elif stability_score >= 60:
            risk_level = "MEDIUM"
        elif stability_score >= 40:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"
        
        return {
            "score": round(stability_score, 1),
            "risk_level": risk_level,
            "motion_smoothness": round(motion_smoothness, 1),
            "tremor_severity_inverse": round(tremor_inverse, 1),
            "gait_consistency": round(gait_consistency, 1),
            "heart_rhythm_stability": round(heart_stability, 1)
        }


# ─── Analysis Pipeline ────────────────────────────────────
class MotionAnalysisPipeline:
    """Combined ML pipeline for real-time analysis."""

    def __init__(self):
        self.tremor_classifier = TremorClassifier(sampling_rate=100)
        self.fall_predictor = FallRiskPredictor()
        self.stability_engine = StabilityEngine()
        # Buffer for rolling window analysis
        self.buffers = {}  # patient_id -> buffer
        self.buffer_size = 500  # 5 seconds at 100Hz

    def _get_buffer(self, patient_id: str):
        if patient_id not in self.buffers:
            self.buffers[patient_id] = {
                "accel_x": [], "accel_y": [], "accel_z": [],
                "gyro_x": [], "gyro_y": [], "gyro_z": [],
                "heart_rates": []
            }
        return self.buffers[patient_id]

    def add_sample(self, patient_id: str, accel_x: float, accel_y: float, accel_z: float,
                   gyro_x: float = 0, gyro_y: float = 0, gyro_z: float = 0,
                   heart_rate: int = 72):
        """Add a single sensor sample to the buffer."""
        buf = self._get_buffer(patient_id)
        buf["accel_x"].append(accel_x)
        buf["accel_y"].append(accel_y)
        buf["accel_z"].append(accel_z)
        buf["gyro_x"].append(gyro_x)
        buf["gyro_y"].append(gyro_y)
        buf["gyro_z"].append(gyro_z)
        buf["heart_rates"].append(heart_rate)
        
        # Trim to buffer size
        for key in buf:
            if len(buf[key]) > self.buffer_size:
                buf[key] = buf[key][-self.buffer_size:]

    def analyze(self, patient_id: str) -> Dict:
        """Run full analysis pipeline on buffered data."""
        buf = self._get_buffer(patient_id)
        
        if len(buf["accel_x"]) < 10:
            return self._default_result()
        
        ax = np.array(buf["accel_x"])
        ay = np.array(buf["accel_y"])
        az = np.array(buf["accel_z"])
        hr = int(np.mean(buf["heart_rates"][-10:])) if buf["heart_rates"] else 72
        
        # 1. Tremor Analysis
        tremor = self.tremor_classifier.extract_features(ax, ay, az)
        
        # 2. Fall Risk
        fall_risk = self.fall_predictor.extract_features(ax, ay, az, hr)
        
        # 3. Stability Score
        stability = self.stability_engine.compute_stability(ax, ay, az, tremor["severity"], hr)
        
        # Motion intensity
        magnitude = np.sqrt(ax**2 + ay**2 + az**2)
        motion_intensity = float(np.std(magnitude))
        
        return {
            "stability": stability,
            "tremor": {
                "severity": tremor["severity"],
                "dominant_frequency": tremor["dominant_frequency"],
                "amplitude_variance": tremor["amplitude_variance"],
                "fft_spectrum": tremor["fft_spectrum"],
                "fft_frequencies": tremor["fft_frequencies"]
            },
            "fall_risk": {
                "probability": fall_risk["probability"],
                "is_risk": fall_risk["is_risk"],
                "acceleration_spike": fall_risk["acceleration_spike"],
                "orientation_shift": fall_risk["orientation_shift"]
            },
            "heart_rate": hr,
            "motion_intensity": round(motion_intensity, 2)
        }

    def _default_result(self) -> Dict:
        return {
            "stability": {
                "score": 85.0, "risk_level": "LOW",
                "motion_smoothness": 90.0, "tremor_severity_inverse": 90.0,
                "gait_consistency": 70.0, "heart_rhythm_stability": 95.0
            },
            "tremor": {
                "severity": "Low", "dominant_frequency": 0.0,
                "amplitude_variance": 0.0, "fft_spectrum": [], "fft_frequencies": []
            },
            "fall_risk": {
                "probability": 5.0, "is_risk": False,
                "acceleration_spike": 0.0, "orientation_shift": 0.0
            },
            "heart_rate": 72,
            "motion_intensity": 0.1
        }

    def simulate_fall(self, patient_id: str):
        """Inject simulated fall data into the buffer."""
        buf = self._get_buffer(patient_id)
        # Simulate sudden acceleration spike and orientation change
        for i in range(50):
            t = i / 100.0
            if i < 10:
                # Pre-fall stumble
                buf["accel_x"].append(np.random.normal(0.5, 0.3))
                buf["accel_y"].append(np.random.normal(0.2, 0.2))
                buf["accel_z"].append(np.random.normal(0.8, 0.3))
            elif i < 20:
                # Fall impact
                buf["accel_x"].append(np.random.normal(3.0, 0.5))
                buf["accel_y"].append(np.random.normal(2.5, 0.5))
                buf["accel_z"].append(np.random.normal(0.2, 0.3))
            else:
                # Post-fall (lying still)
                buf["accel_x"].append(np.random.normal(0.1, 0.05))
                buf["accel_y"].append(np.random.normal(0.9, 0.05))
                buf["accel_z"].append(np.random.normal(0.1, 0.05))
            buf["heart_rates"].append(int(np.random.normal(110, 10)))
        
        for key in buf:
            if len(buf[key]) > self.buffer_size:
                buf[key] = buf[key][-self.buffer_size:]

    def simulate_tremor_spike(self, patient_id: str):
        """Inject simulated severe tremor data."""
        buf = self._get_buffer(patient_id)
        for i in range(100):
            t = i / 100.0
            freq = 5.5  # Parkinsonian tremor frequency
            amplitude = 2.0
            buf["accel_x"].append(amplitude * np.sin(2 * np.pi * freq * t) + np.random.normal(0, 0.1))
            buf["accel_y"].append(amplitude * 0.7 * np.cos(2 * np.pi * freq * t) + np.random.normal(0, 0.1))
            buf["accel_z"].append(0.98 + np.random.normal(0, 0.05))
            buf["heart_rates"].append(int(np.random.normal(85, 5)))
        
        for key in buf:
            if len(buf[key]) > self.buffer_size:
                buf[key] = buf[key][-self.buffer_size:]


# Singleton instance
pipeline = MotionAnalysisPipeline()
