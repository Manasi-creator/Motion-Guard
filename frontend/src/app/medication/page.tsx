'use client';
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch, cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, AreaChart
} from 'recharts';

export default function MedicationPage() {
  const [medications, setMedications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [adherence, setAdherence] = useState<any[]>([]);
  const [currentMonth] = useState('March 2026');

  useEffect(() => {
    apiFetch('/api/medications?patient_id=8821').then(setMedications).catch(() => {
      setMedications([
        { drug_name: 'Carbidopa-Levodopa', dosage: '25-100 mg', frequency: '3x Daily', schedule: ['8am', '2pm', '8pm'], efficacy: 'High', next_dose: 'In 42m' },
        { drug_name: 'Pramipexole', dosage: '0.5 mg', frequency: '2x Daily', schedule: ['9am', '9pm'], efficacy: 'Moderate', next_dose: 'In 3h' },
      ]);
    });
    apiFetch('/api/medications/8821/stats').then(setStats).catch(() => {
      setStats({ adherence_rate: 94, avg_stability_gain: 12, doses_taken: 26, doses_total: 28, current_status: 'Optimal Stability' });
    });
    apiFetch('/api/medications/8821/adherence').then(setAdherence).catch(() => {
      setAdherence([]);
    });
  }, []);

  // Efficacy correlation graph data (simulated)
  const efficacyData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      const hour = 8 + i * 0.67;
      const hourStr = `${Math.floor(hour)}:${Math.round((hour % 1) * 60).toString().padStart(2, '0')}`;
      const stability = 70 + 15 * Math.sin((hour - 10) / 3) + Math.random() * 5;
      const tremor = 30 - 10 * Math.sin((hour - 10) / 3) + Math.random() * 5;
      data.push({
        time: hourStr,
        stability: Math.round(stability),
        tremor: Math.round(tremor),
        dosage: (hour === 8 || hour === 14 || hour === 20) ? 80 : null,
      });
    }
    return data;
  }, []);

  // Calendar data
  const calendarDays = useMemo(() => {
    const days: { day: number; status: string }[] = [];
    const statuses = ['Taken', 'Taken', 'Taken', 'Taken', 'Taken', 'Delayed', 'Taken',
      'Taken', 'Missed', 'Taken', 'Taken', 'Taken', 'Delayed', 'Taken',
      'Taken', 'Taken', 'Delayed', 'Taken', 'Taken', 'Taken', 'Taken',
      'Taken', 'Taken', 'Taken', 'Missed', 'Taken', 'Delayed', 'Taken',
      'Taken', 'Taken'];
    for (let i = 1; i <= 31; i++) {
      days.push({ day: i, status: statuses[i - 1] || 'Taken' });
    }
    return days;
  }, []);

  const doseMini = useMemo(() => {
    if (!stats) return [];
    const taken = stats.doses_taken || 26;
    const total = stats.doses_total || 28;
    const arr = [];
    for (let i = 0; i < total; i++) {
      arr.push(i < taken ? 'taken' : 'missed');
    }
    return arr.slice(-7);
  }, [stats]);

  return (
    <DashboardLayout headerProps={{ showSearch: true }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medication Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor adherence and efficacy correlations for Parkinson&apos;s treatment.</p>
        </div>
        <button className="px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 flex items-center gap-2 transition-colors">
          <span className="text-lg">⊕</span>
          Add New Medication
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Adherence Rate</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{stats?.adherence_rate ?? 94}%</span>
          </div>
          <p className="text-xs text-green-500 font-medium mt-1">↗ 2.1%</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${stats?.adherence_rate ?? 94}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg. Stability Gain</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">+{stats?.avg_stability_gain ?? 12}%</span>
          </div>
          <p className="text-xs text-green-500 font-medium mt-1">↗ 0.4%</p>
          <p className="text-[10px] text-gray-400 mt-1">Post-Dosage Average</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Doses Taken (7d)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{stats?.doses_taken ?? 26}/{stats?.doses_total ?? 28}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-2">
            {doseMini.map((s, i) => (
              <div key={i} className={cn('w-4 h-4 rounded-sm', s === 'taken' ? 'bg-primary-500' : 'bg-red-400')} />
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="text-lg font-bold text-gray-900">Optimal Stability</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Next dose in 42 minutes</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Efficacy Correlation Graph */}
        <div className="col-span-7 glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Efficacy Correlation Graph</h3>
              <p className="text-[10px] text-gray-400">Medication Intake vs. Stability Scores (Last 24 Hours)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Stability</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Tremor</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Dosage</span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficacyData}>
                <defs>
                  <linearGradient id="stabilityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#137fec" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#137fec" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={3} />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="stability" stroke="#137fec" strokeWidth={2} fill="url(#stabilityGrad)" />
                <Line type="monotone" dataKey="tremor" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Adherence Calendar */}
        <div className="col-span-5 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Adherence Calendar</h3>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600">‹</button>
              <span className="text-sm font-medium text-gray-900">{currentMonth}</span>
              <button className="text-gray-400 hover:text-gray-600">›</button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
            {/* Offset days for Oct 2023 (starts on Sunday) */}
            {[25, 26, 27, 28, 29, 30].map(d => (
              <div key={`prev-${d}`} className="text-center py-1.5 text-[10px] text-gray-300">{d}</div>
            ))}
            {calendarDays.slice(0, 31).map(({ day, status }) => (
              <div key={day} className="text-center py-1.5 relative">
                <span className={cn(
                  'text-xs font-medium',
                  day === 6 ? 'w-6 h-6 inline-flex items-center justify-center rounded-full bg-primary-500 text-white' : 'text-gray-700'
                )}>
                  {day}
                </span>
                <div className="flex justify-center mt-0.5">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    status === 'Taken' ? 'bg-green-500' : status === 'Missed' ? 'bg-red-500' : 'bg-yellow-500'
                  )}></span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Taken</span>
              <span className="font-bold text-gray-900 ml-1">24 Days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Missed</span>
              <span className="font-bold text-gray-900 ml-1">2 Days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">Delayed</span>
              <span className="font-bold text-gray-900 ml-1">4 Days</span>
            </div>
          </div>
        </div>

        {/* Medication List */}
        <div className="col-span-7 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Current Medication List</h3>
            <button className="text-xs text-primary-500 font-medium hover:underline">View History</button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drug Name</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dosage</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frequency</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Next Dose</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Efficacy</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <span className="text-primary-500 text-sm">💊</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{med.drug_name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">{med.dosage}</td>
                  <td className="py-4">
                    <p className="text-sm text-gray-600">{med.frequency}</p>
                    <p className="text-[10px] text-gray-400">({med.schedule?.join(', ')})</p>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-medium text-primary-500">{med.next_dose}</span>
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-bold',
                      med.efficacy === 'High' ? 'text-green-600' : 'text-yellow-600'
                    )}>
                      ⚡ {med.efficacy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Recommendation */}
        <div className="col-span-5 glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-primary-500 text-lg">🎯</span>
            <h3 className="text-sm font-bold text-primary-500">AI Recommendation</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Efficacy dips observed 3 hours after evening Levodopa intake. Consider discussing an extended-release
            option with your clinician to improve night-time stability.
          </p>
          <button className="mt-4 text-sm text-primary-500 font-medium hover:underline">
            Read Detailed Analysis →
          </button>
        </div>
      </div>

      {/* Doctor Footer */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
          SC
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Dr. Sarah Chen</p>
          <p className="text-xs text-gray-500">Senior Neurologist</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
