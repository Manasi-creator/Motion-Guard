import { useState, useEffect, useCallback } from 'react';

export type SensorReading = {
  accX: number;
  accY: number;
  tremorFreq: number;
  disease: string;
  ir: number;
  finger: string;
  sound: number;
  alert: boolean;
  timestamp: string;
};

export function useSensorData(patientId: string, pollInterval = 2000) {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAlert, setHasAlert] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8000/api/sensor-data/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data: SensorReading[] = await res.json();
      setReadings(data.slice(0, 50).reverse()); // oldest → newest for chart
      if (data.length > 0) {
        setLatest(data[0]);
        setHasAlert(data[0].alert);
      }
    } catch (e) {
      console.error('Sensor fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  return { readings, latest, loading, hasAlert };
}