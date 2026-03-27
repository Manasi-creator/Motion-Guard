'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

type DoctorStats = {
  totalPatients: number;
  criticalAlerts: number;
  avgStability: number;
  pendingReviews: number;
  overview: string[];
};

export default function DoctorDashboard() {
  const { fetchWithAuth, getUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DoctorStats>({
    totalPatients: 0,
    criticalAlerts: 0,
    avgStability: 0,
    pendingReviews: 0,
    overview: [],
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const localUser = getUser();

      let patients: any[] = [];
      if (localUser?.id) {
        const patientsRes = await fetchWithAuth(`/api/doctor/${localUser.id}/patients`);
        if (patientsRes.ok) {
          patients = await patientsRes.json();
        }
      }

      if (patients.length === 0) {
        const allPatientsRes = await fetchWithAuth('/api/patients');
        if (allPatientsRes.ok) {
          patients = await allPatientsRes.json();
        }
      }

      const alertsRes = await fetchWithAuth('/api/alerts');
      const alerts = alertsRes.ok ? await alertsRes.json() : [];

      const patientIds = patients
        .map((p) => p.patient_id)
        .filter(Boolean)
        .slice(0, 8);

      let avgStability = 0;
      if (patientIds.length > 0) {
        const summaries = await Promise.all(
          patientIds.map(async (pid: string) => {
            try {
              const response = await fetchWithAuth(`/api/patients/${pid}/summary`);
              if (!response.ok) return null;
              return response.json();
            } catch {
              return null;
            }
          })
        );

        const validSummaries = (await Promise.all(summaries)).filter(Boolean) as any[];
        if (validSummaries.length > 0) {
          const total = validSummaries.reduce((sum, item) => sum + (item.stability_score || 0), 0);
          avgStability = Math.round(total / validSummaries.length);
        }
      }

      const criticalAlerts = alerts.filter((a: any) => String(a.severity).toUpperCase() === 'CRITICAL').length;
      const pendingReviews = alerts.filter((a: any) => String(a.status).toLowerCase() !== 'resolved').length;

      const overview = [
        `${criticalAlerts} critical alerts in queue`,
        `${pendingReviews} alerts need review`,
        `${patients.length} patients under monitoring`,
      ];

      setStats({
        totalPatients: patients.length,
        criticalAlerts,
        avgStability,
        pendingReviews,
        overview,
      });
    } catch {
      setStats((prev) => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, getUser]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  return (
    <DashboardLayout
      headerProps={{
        breadcrumbs: [{ label: 'Doctor' }, { label: 'Dashboard' }],
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage patients, monitor telemetry, and review risk insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Patients</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalPatients}</p>
          <p className="text-xs text-green-600 mt-1">Live from database</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Critical Alerts</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.criticalAlerts}</p>
          <p className="text-xs text-red-600 mt-1">Needs attention</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Avg Stability</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : `${stats.avgStability}%`}</p>
          <p className="text-xs text-green-600 mt-1">Realtime patient summaries</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Reviews</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.pendingReviews}</p>
          <p className="text-xs text-yellow-600 mt-1">Follow-up required</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/doctor/profile" className="px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition-colors">👤 My Profile</Link>
            <Link href="/live-monitor" className="px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-900 font-medium transition-colors">📡 Live Monitoring</Link>
            <Link href="/analytics" className="px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition-colors">📊 Analytics</Link>
            <Link href="/alerts" className="px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 font-medium transition-colors">🚨 Alerts</Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Today Overview</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {stats.overview.map((line) => (
              <p key={line}>• {line}</p>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
