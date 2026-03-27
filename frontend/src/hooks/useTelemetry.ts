'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE } from '@/lib/utils';

export interface TelemetryData {
  patient_id: string;
  timestamp: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  heart_rate: number;
  spo2: number;
  stability_score: number;
  risk_level: string;
  tremor_severity: string;
  dominant_frequency: number;
  fall_probability: number;
  motion_intensity: number;
  fft_spectrum: number[];
  fft_frequencies: number[];
  motion_smoothness: number;
  gait_consistency: number;
  heart_rhythm_stability: number;
  type?: string;
}

export function useTelemetry(patientId?: string) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const historyRef = useRef<TelemetryData[]>([]);
  const maxHistory = 500;

  const connect = useCallback(() => {
    const url = patientId
      ? `${WS_BASE}/ws/telemetry/${patientId}`
      : `${WS_BASE}/ws/telemetry`;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'alert') {
          setAlerts(prev => [parsed, ...prev].slice(0, 50));
        } else if (parsed.type === 'telemetry') {
          setData(parsed);
          historyRef.current = [...historyRef.current, parsed].slice(-maxHistory);
          setHistory(historyRef.current);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 2 seconds
      setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };

    wsRef.current = ws;
  }, [patientId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendCommand = useCallback((action: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action }));
    }
  }, []);

  return { data, history, alerts, connected, sendCommand };
}
