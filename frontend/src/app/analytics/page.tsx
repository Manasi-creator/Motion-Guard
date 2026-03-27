'use client';
import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'Weeks' | 'Months'>('Weeks');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/analytics/99210/stats').then(setStats).catch(() => {
      setStats({
        stability_index: { value: 88, change: 4.2 },
        avg_daily_walk: { value: 142, unit: 'm', change: -10.5 },
        tremor_events: { value: 12, change: 2.1 },
        fall_risk: { value: 'Low', label: 'Based on gait symmetry' },
        gait_symmetry: 94.2,
        postural_sway: 0.12,
        resting_tremor: 'Moderate'
      });
    });
  }, []);

  // Long-term stability trend data
  const stabilityTrend = useMemo(() => {
    const months = ['APRIL', 'MAY', 'JUNE', 'JULY'];
    const data = [];
    let base = 55;
    for (let i = 0; i < 120; i++) {
      base += (Math.random() - 0.4) * 2;
      base = Math.max(40, Math.min(95, base));
      if (i > 60) base += 0.15; // Upward trend
      data.push({
        idx: i,
        score: Math.round(base * 10) / 10,
        month: months[Math.floor(i / 30)],
      });
    }
    return data;
  }, []);

  // Activity breakdown for donut chart
  const activityData = [
    { name: 'Walking', value: 60, color: '#137fec' },
    { name: 'Standing', value: 15, color: '#f59e0b' },
    { name: 'Sitting', value: 15, color: '#9ca3af' },
    { name: 'Tremors', value: 10, color: '#ef4444' },
  ];

  // Heatmap data
  const heatmapData = useMemo(() => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const hours = 24;
    return days.map(day => ({
      day,
      cells: Array.from({ length: hours }, (_, h) => ({
        hour: h,
        value: Math.random() * 100,
        hasEvent: Math.random() > 0.85,
      }))
    }));
  }, []);

  return (
    <DashboardLayout headerProps={{ showSearch: true, doctorName: 'Sarah Jenkins', doctorRole: 'Neurology Head' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Mobility Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed motor function assessment for: <span className="font-medium">ID-99210 (John Doe)</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700">Last 30 Days</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stability Index</p>
            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">+4.2%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{stats?.stability_index?.value ?? 88}</span>
            <span className="text-sm text-gray-400">/100</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${stats?.stability_index?.value ?? 88}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg. Daily Walk</p>
            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">-10.5%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">142</span>
            <span className="text-sm text-gray-400">m</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">vs. 159m last month</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tremor Events</p>
            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">+2.1%</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">12</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Average daily count</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Fall Risk</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-green-600">Low</span>
            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">STABLE</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Based on gait symmetry</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Long-term Stability Trend */}
        <div className="col-span-7 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-500">📈</span>
              <h3 className="text-sm font-semibold text-gray-900">Long-term Stability Trend</h3>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setPeriod('Weeks')}
                className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  period === 'Weeks' ? 'bg-primary-500 text-white' : 'text-gray-500')}
              >
                Weeks
              </button>
              <button
                onClick={() => setPeriod('Months')}
                className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  period === 'Months' ? 'bg-primary-500 text-white' : 'text-gray-500')}
              >
                Months
              </button>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stabilityTrend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#137fec" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#137fec" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="idx"
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  tickFormatter={(val) => {
                    if (val === 0) return 'APRIL';
                    if (val === 30) return 'MAY';
                    if (val === 60) return 'JUNE';
                    if (val === 90) return 'JULY';
                    return '';
                  }}
                />
                <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="score" stroke="#137fec" strokeWidth={2.5} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Breakdown Donut */}
        <div className="col-span-5 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary-500">📊</span>
            <h3 className="text-sm font-semibold text-gray-900">Activity Breakdown</h3>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative" style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">7.2h</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold">Total Tracked</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {activityData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs text-gray-600">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instability Heatmap */}
        <div className="col-span-6 glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-400">🔥</span>
            <h3 className="text-sm font-semibold text-gray-900">Instability Heatmap</h3>
            <span className="text-xs text-gray-400 ml-2">Freq. of tremors/instability events</span>
          </div>
          <div className="space-y-1.5">
            {heatmapData.map(row => (
              <div key={row.day} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-8">{row.day}</span>
                <div className="flex gap-0.5 flex-1">
                  {row.cells.map((cell, i) => (
                    <div
                      key={i}
                      className="flex-1 h-5 rounded-sm"
                      style={{
                        backgroundColor: cell.hasEvent
                          ? `rgba(59, 130, 246, ${0.3 + cell.value / 150})`
                          : '#f1f5f9',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-between text-[9px] text-gray-400 px-10 mt-1">
              <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
            </div>
          </div>
        </div>

        {/* Multi-Sensor Data Fusion */}
        <div className="col-span-6 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-purple-500">🔌</span>
              <h3 className="text-sm font-semibold text-gray-900">Multi-Sensor Data Fusion</h3>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <span className="px-3 py-1 rounded-md text-xs font-medium bg-primary-500 text-white">Wrist</span>
              <span className="px-3 py-1 rounded-md text-xs font-medium text-gray-500">Waist</span>
            </div>
          </div>
          <div className="space-y-4">
            {/* Postural Sway */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Postural Sway</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">0.12m/s²</span>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            {/* Gait Symmetry */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Gait Symmetry</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">94.2%</span>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            {/* Resting Tremor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Resting Tremor</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-orange-500">Moderate</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-red-400 h-2 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
