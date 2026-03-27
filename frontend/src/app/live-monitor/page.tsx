'use client';
import React, { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CircularRiskIndicator } from '@/components/ui/Cards';
import { useTelemetry } from '@/hooks/useTelemetry';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';

export default function LiveMonitorPage() {
  const { data, history, connected, sendCommand } = useTelemetry('8829');

  const tremorData = useMemo(() => {
    const slice = history.slice(-80);
    return slice.map((d, i) => ({
      idx: i,
      x: d.accel_x,
      y: d.accel_y,
      z: d.accel_z,
    }));
  }, [history]);

  const heartData = useMemo(() => {
    const slice = history.slice(-80);
    return slice.map((d, i) => ({
      idx: i,
      bpm: d.heart_rate,
    }));
  }, [history]);

  const fftData = useMemo(() => {
    if (!data?.fft_spectrum || !data?.fft_frequencies) return [];
    return data.fft_frequencies.map((f, i) => ({
      freq: `${f.toFixed(1)}Hz`,
      magnitude: data.fft_spectrum[i] || 0,
    })).slice(0, 15);
  }, [data]);

  const riskLevel = data?.risk_level ?? 'LOW';
  const heartRate = data?.heart_rate ?? 72;
  const dominantFreq = data?.dominant_frequency ?? 6.42;

  return (
    <DashboardLayout
      headerProps={{
        breadcrumbs: [
          { label: 'Patients' },
          { label: 'ID-8829 Live Telemetry' },
        ],
        rightContent: (
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Session
          </button>
        ),
      }}
    >
      {/* Patient Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sarah Jenkins</h1>
            <p className="text-sm text-gray-500">Session: 02:45:12 | Unit 402, Station B-12</p>
          </div>
        </div>
        <CircularRiskIndicator level={riskLevel} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main Waveform Chart */}
        <div className="col-span-8 glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-purple-500 text-lg">〰</span>
              <h3 className="text-sm font-semibold text-gray-900">Real-time Tremor Intensity (XYZ Axes)</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> X-Axis</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Y-Axis</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Z-Axis</span>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tremorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="idx" tick={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="x" stroke="#3b82f6" strokeWidth={1.5} dot={false} animationDuration={0} />
                <Line type="monotone" dataKey="y" stroke="#22c55e" strokeWidth={1.5} dot={false} animationDuration={0} />
                <Line type="monotone" dataKey="z" stroke="#ef4444" strokeWidth={1.5} dot={false} animationDuration={0} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-xs px-3 py-1 bg-blue-50 text-primary-500 rounded-full font-medium">
              Sampling: 100Hz | Buffer: 5.0s
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-4">
          {/* Camera Feed Placeholder */}
          <div className="glass-card overflow-hidden">
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[10px] text-white font-medium">LIVE FEED</span>
              </div>
              <div className="absolute top-2 right-2 text-[10px] text-gray-300 font-mono">
                {new Date().toISOString().replace('T', ' ').slice(0, 19)}
              </div>
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-500">Camera Feed Placeholder</p>
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] text-white">
                <p className="font-medium">Patient Obs: Cam 01</p>
                <p className="text-gray-400">Station B-12 | IR Night Vision Active</p>
              </div>
            </div>
          </div>

          {/* FFT Spectrum */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary-500">📊</span>
              <h3 className="text-sm font-semibold text-gray-900">Frequency Spectrum (FFT)</h3>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fftData}>
                  <XAxis dataKey="freq" tick={{ fontSize: 8 }} stroke="#94a3b8" interval={2} />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Bar dataKey="magnitude" radius={[3, 3, 0, 0]}>
                    {fftData.map((entry, i) => (
                      <Cell key={i} fill={i >= 3 && i <= 6 ? '#137fec' : '#dbeafe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-2 px-2 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-xs text-gray-600">Tremor Peak</span>
              <span className="text-sm font-bold text-red-500">{dominantFreq.toFixed(2)} Hz</span>
            </div>
          </div>
        </div>

        {/* Plethysmograph (Heart Rate) */}
        <div className="col-span-8 glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-red-400">❤️</span>
              <h3 className="text-sm font-semibold text-gray-900">Plethysmograph (MAX30102)</h3>
            </div>
            <span className="text-2xl font-bold text-gray-900">{heartRate} <span className="text-sm font-normal text-gray-400">BPM</span></span>
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={heartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="idx" tick={false} />
                <YAxis domain={[50, 110]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Line type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={0} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="col-span-4 glass-card p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Demo Controls</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => sendCommand('simulate_fall')}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ⚠️ Simulate Fall
            </button>
            <button
              onClick={() => sendCommand('simulate_tremor')}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ⚡ Simulate Tremor Spike
            </button>
          </div>
        </div>

        {/* Bottom Status Row */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-lg">📡</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">MPU6050 (MOTION)</p>
              <p className="text-[10px] text-gray-500">Latency: <span className="text-primary-500 font-bold">4.2ms</span></p>
            </div>
            <div className="ml-auto flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-1 rounded-full ${i <= 3 ? 'bg-primary-500' : 'bg-gray-200'}`} style={{ height: 8 + i * 4 }} />
              ))}
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-lg">🔌</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">MAX30102 (OX)</p>
              <p className="text-[10px] text-gray-500">Signal: <span className="text-green-600 font-bold">STRONG</span></p>
            </div>
            <span className="ml-auto w-3 h-3 rounded-full bg-green-500"></span>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase">Packet Loss</span>
            <span className="text-lg font-bold text-gray-900 ml-auto">0.02%</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-6 h-2 rounded-full ${i <= 4 ? 'bg-green-500' : 'bg-red-400'}`} />
              ))}
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Latest System Event</p>
              <p className="text-[10px] text-gray-600 font-mono">[{new Date().toLocaleTimeString()}] Packet Sync ...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Footer */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
          SM
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Dr. Sarah Miller</p>
          <p className="text-xs text-gray-500">Neurologist</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
