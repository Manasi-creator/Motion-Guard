'use client';
import React, { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSensorData } from '@/hooks/useSensorData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const DISEASE_COLORS: Record<string, string> = {
  "Parkinson's": '#ef4444',
  "Essential Tremor": '#f97316',
  "Huntington's": '#a855f7',
  "Normal": '#22c55e',
};

export default function ArduinoMonitorPage() {
  const { readings, latest, loading, hasAlert } = useSensorData('8821', 2000);

  const chartData = useMemo(() =>
    readings.map((r, i) => ({
      idx: i,
      accX: r.accX,
      accY: r.accY,
      freq: r.tremorFreq,
    })), [readings]);

  const freqBuckets = useMemo(() => {
    const counts: Record<string, number> = {};
    readings.forEach(r => {
      const key = `${r.tremorFreq}Hz`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([freq, count]) => ({ freq, count }));
  }, [readings]);

  const disease = latest?.disease ?? 'Unknown';
  const diseaseColor = DISEASE_COLORS[disease] ?? '#6b7280';

  return (
    <DashboardLayout
      headerProps={{
        breadcrumbs: [
          { label: 'Monitoring' },
          { label: 'Arduino Sensor Live Feed' },
        ],
      }}
    >
      {/* Alert Banner */}
      {hasAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex items-center gap-3 animate-pulse">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-bold text-red-700">TREMOR ALERT DETECTED</p>
            <p className="text-sm text-red-600">
              High tremor frequency detected — {latest?.tremorFreq} Hz — {disease}
            </p>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Disease</p>
          <p className="text-lg font-bold" style={{ color: diseaseColor }}>
            {disease}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Tremor Freq</p>
          <p className="text-lg font-bold text-gray-900">
            {latest?.tremorFreq ?? '--'} Hz
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">IR Sensor</p>
          <p className="text-lg font-bold text-gray-900">
            {latest?.ir === 1 ? '🟢 Active' : '⚫ Inactive'}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Finger Detect</p>
          <p className="text-lg font-bold text-gray-900">
            {latest?.finger === 'YES' ? '✅ YES' : '❌ NO'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Accelerometer Chart */}
        <div className="col-span-8 glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              📡 Live Accelerometer (AccX / AccY)
            </h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> AccX
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> AccY
              </span>
            </div>
          </div>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Waiting for Arduino data...
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="idx" tick={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(val: any, name: string) => [val, name === 'accX' ? 'AccX' : 'AccY']}
                  />
                  <Line type="monotone" dataKey="accX" stroke="#3b82f6" strokeWidth={1.5} dot={false} animationDuration={0} />
                  <Line type="monotone" dataKey="accY" stroke="#22c55e" strokeWidth={1.5} dot={false} animationDuration={0} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right — Latest Reading */}
        <div className="col-span-4 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🔢 Latest Raw Values</h3>
            {latest ? (
              <div className="space-y-2 text-sm">
                {[
                  ['AccX', latest.accX],
                  ['AccY', latest.accY],
                  ['TremorFreq', `${latest.tremorFreq} Hz`],
                  ['IR', latest.ir],
                  ['Sound', latest.sound],
                  ['Finger', latest.finger],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className="font-bold text-gray-900">{value as string}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No data yet. Is Arduino connected?</p>
            )}
          </div>

          {/* Connection Status */}
          <div className="glass-card p-4 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${readings.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <div>
              <p className="text-xs font-bold text-gray-900">Arduino Status</p>
              <p className="text-xs text-gray-500">
                {readings.length > 0 ? `${readings.length} readings received` : 'Waiting for device...'}
              </p>
            </div>
          </div>
        </div>

        {/* Tremor Frequency Distribution */}
        <div className="col-span-12 glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            📊 Tremor Frequency Distribution
          </h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="freq" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {freqBuckets.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.freq === '5Hz' ? '#ef4444' :
                        entry.freq === '3Hz' ? '#f97316' : '#3b82f6'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-xs justify-center">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Normal (2Hz)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Moderate (3Hz)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critical (5Hz)</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}