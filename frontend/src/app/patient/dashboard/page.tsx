'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTelemetry } from '@/hooks/useTelemetry';

type PatientDashboardStats = {
  healthStatus: string;
  heartRate: number;
  stabilityScore: number;
  adherenceRate: number;
  tips: string[];
};

export default function PatientDashboard() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string>('8821');
  const { data } = useTelemetry(patientId);
  const [stats, setStats] = useState<PatientDashboardStats>({
    healthStatus: 'Unknown',
    heartRate: 0,
    stabilityScore: 0,
    adherenceRate: 0,
    tips: [],
  });

  const loadPatientData = useCallback(async () => {
    try {
      const meRes = await fetchWithAuth('/api/auth/me');
      const me = meRes.ok ? await meRes.json() : null;

      const patientsRes = await fetchWithAuth('/api/patients');
      const patients = patientsRes.ok ? await patientsRes.json() : [];

      const matched =
        patients.find((p: any) => String(p.name).toLowerCase() === String(me?.name || '').toLowerCase()) ||
        patients.find((p: any) => p.patient_id === me?.patient_id) ||
        patients[0];

      const currentPatientId = matched?.patient_id || '8821';
      setPatientId(currentPatientId);

      const summaryRes = await fetchWithAuth(`/api/patients/${currentPatientId}/summary`);
      const summary = summaryRes.ok ? await summaryRes.json() : null;

      const medRes = await fetchWithAuth(`/api/medications/${currentPatientId}/stats`);
      const medStats = medRes.ok ? await medRes.json() : null;

      const healthStatus =
        summary?.risk_level === 'CRITICAL' || summary?.risk_level === 'HIGH'
          ? 'Needs Attention'
          : summary?.risk_level === 'MEDIUM'
          ? 'Moderate'
          : 'Good';

      setStats({
        healthStatus,
        heartRate: summary?.heart_rate ?? 0,
        stabilityScore: Math.round(summary?.stability_score ?? 0),
        adherenceRate: Math.round(medStats?.adherence_rate ?? 0),
        tips: [
          `Risk level: ${summary?.risk_level || 'Unknown'}`,
          `Motion intensity: ${summary?.motion_intensity?.toFixed?.(1) ?? 'N/A'}`,
          `Medication adherence: ${medStats?.adherence_rate ?? 0}%`,
        ],
      });
    } catch {
      setStats((prev) => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadPatientData();
    const interval = setInterval(loadPatientData, 8000);
    return () => clearInterval(interval);
  }, [loadPatientData]);

  const liveHeartRate = useMemo(() => {
    return data?.heart_rate ?? stats.heartRate;
  }, [data?.heart_rate, stats.heartRate]);

  const liveStability = useMemo(() => {
    return Math.round(data?.stability_score ?? stats.stabilityScore);
  }, [data?.stability_score, stats.stabilityScore]);

  return (
    <DashboardLayout
      headerProps={{
        breadcrumbs: [{ label: 'Patient' }, { label: 'Dashboard' }],
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your health metrics, medication adherence, and safety alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Health Status</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.healthStatus}</p>
          <p className="text-xs text-green-600 mt-1">Live from patient summary</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Heart Rate</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : liveHeartRate}</p>
          <p className="text-xs text-blue-600 mt-1">bpm | realtime telemetry</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stability Score</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : `${liveStability}%`}</p>
          <p className="text-xs text-green-600 mt-1">Low risk</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medication Adherence</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : `${stats.adherenceRate}%`}</p>
          <p className="text-xs text-purple-600 mt-1">From medication stats API</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/patient/profile" className="px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition-colors">👤 My Profile</Link>
            <Link href="/live-monitor" className="px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-900 font-medium transition-colors">📡 Live Monitoring</Link>
            <Link href="/analytics" className="px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition-colors">📊 Health Analytics</Link>
            <Link href="/medication" className="px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 font-medium transition-colors">💊 Medication</Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Health Tips</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {stats.tips.map((tip) => (
              <p key={tip}>• {tip}</p>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
