'use client';
import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { cn } from '@/lib/utils';

/* ─── Simulated AI Narrative ─── */
const weeklyNarrative = `Over the past 7 days, Eleanor Vance has shown moderate improvement in overall mobility. Her gait symmetry improved from 82% to 88.5%, likely correlated with the levodopa dosage adjustment on Day 3. Minor instability spikes on Tuesday and Thursday occurred during early morning transfers (06:15–06:45 AM window) — consistent with medication wearing off before her 7 AM dose.

**Tremor frequency** remained in the benign range (3–6 Hz), with no episodes exceeding severity level 2. The AI model predicts a low probability (12%) of fall within the next 48 hours, contingent on continued medication adherence.

**Recommendations:** Consider adjusting morning dose timing 30 minutes earlier. Suggest physical therapy re-evaluation for hip flexor strength.`;

/* ─── Stub Data ─── */
const stabilityPrediction = [
  { day: 'Mon', actual: 92, predicted: 91 },
  { day: 'Tue', actual: 89, predicted: 90 },
  { day: 'Wed', actual: 91, predicted: 91 },
  { day: 'Thu', actual: 87, predicted: 89 },
  { day: 'Fri', actual: 93, predicted: 92 },
  { day: 'Sat', actual: null, predicted: 93 },
  { day: 'Sun', actual: null, predicted: 94 },
];

const confidenceBars = [
  { label: 'Stability Index', value: 94.2, color: '#137fec' },
  { label: 'Gait Symmetry', value: 88.5, color: '#10b981' },
  { label: 'Fall Risk (inv)', value: 88, color: '#f59e0b' },
  { label: 'Medication Eff.', value: 91.3, color: '#8b5cf6' },
];

const recommendations = [
  { icon: '💊', title: 'Adjust Morning Dose', desc: 'Move levodopa 30 min earlier to reduce AM instability window.', priority: 'High' },
  { icon: '🏃', title: 'PT Re-evaluation', desc: 'Hip flexor strengthening program — schedule within 5 days.', priority: 'Medium' },
  { icon: '📊', title: 'Increase Monitoring', desc: 'Enable 15-min interval checks during 6–7 AM transition.', priority: 'Low' },
];

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const initialChat: ChatMessage[] = [
  { role: 'ai', text: 'Hello Dr. Chen! I\'m your AI Health Assistant for Eleanor Vance. Ask me anything about her mobility trends, medication efficacy, or risk projections.' },
];

export default function AISummaryPage() {
  const [chat, setChat] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input.trim() };
    setChat(prev => [...prev, userMsg]);
    setInput('');

    // Simulated AI reply
    setTimeout(() => {
      const responses: Record<string, string> = {
        'fall': 'Based on current sensor data and ML analysis, Eleanor\'s fall risk is LOW (12%) over the next 48 hours. Key protective factors: consistent gait cadence, stable resting tremor, 96% medication adherence this week.',
        'tremor': 'Eleanor\'s tremor frequency has averaged 4.8 Hz this week (range 3.2–5.9 Hz), classified as Severity Level 1–2. No episodes exceeded the clinical threshold. The FFT analysis shows dominant peaks in the expected Parkinsonian range.',
        'medication': 'Current regimen: Levodopa 250mg (3×/day), Pramipexole 0.5mg (2×/day). Adherence: 96% this week. The stability correlation shows a 6.2% improvement since the dosage adjustment on Day 3.',
      };
      const key = Object.keys(responses).find(k => userMsg.text.toLowerCase().includes(k));
      const reply: ChatMessage = {
        role: 'ai',
        text: key ? responses[key] : `I've analyzed Eleanor's data regarding "${userMsg.text}". Her overall stability index is 94.2% with positive trends across all monitored parameters. Would you like me to generate a detailed report on this topic?`,
      };
      setChat(prev => [...prev, reply]);
    }, 800);
  };

  return (
    <DashboardLayout headerProps={{
      showSearch: true,
      breadcrumbs: undefined,
      doctorName: 'Dr. Sarah Chen',
      doctorRole: 'Neurologist',
    }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Health Summary</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated clinical intelligence for <span className="font-semibold text-gray-700">Eleanor Vance</span> • Patient #6829</p>
        </div>
        <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ─── Top Stat Cards ─── */}
        <div className="col-span-3 glass-card p-5 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overall Stability</p>
          <p className="text-3xl font-extrabold text-primary-500 mt-1">94.2<span className="text-lg">%</span></p>
          <p className="text-xs text-green-600 font-medium mt-1">↑ 2.1% from last week</p>
        </div>
        <div className="col-span-3 glass-card p-5 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gait Symmetry</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">88.5<span className="text-lg">%</span></p>
          <p className="text-xs text-green-600 font-medium mt-1">↑ 6.5% improvement</p>
        </div>
        <div className="col-span-3 glass-card p-5 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fall Risk Score</p>
          <p className="text-3xl font-extrabold text-yellow-500 mt-1">12<span className="text-lg">%</span></p>
          <p className="text-xs text-green-600 font-medium mt-1">↓ Low risk (48h)</p>
        </div>
        <div className="col-span-3 glass-card p-5 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Confidence</p>
          <p className="text-3xl font-extrabold text-purple-500 mt-1">97.1<span className="text-lg">%</span></p>
          <p className="text-xs text-gray-500 font-medium mt-1">Model accuracy</p>
        </div>

        {/* ─── Weekly AI Narrative ─── */}
        <div className="col-span-8 glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-sm">🧠</span>
            <h2 className="text-base font-bold text-gray-900">Weekly AI Health Narrative</h2>
            <span className="px-2 py-0.5 bg-blue-50 text-primary-500 text-[10px] font-bold rounded ml-auto">Auto-Generated</span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-sm whitespace-pre-line">
            {weeklyNarrative.split('**').map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
            <span>Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
            <span>•</span>
            <span>Model: MotionGuard-v3.2</span>
          </div>
        </div>

        {/* ─── AI Confidence Bars ─── */}
        <div className="col-span-4 glass-card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">AI Prediction Confidence</h2>
          <div className="space-y-4">
            {confidenceBars.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Stability Prediction Timeline ─── */}
        <div className="col-span-7 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Stability Prediction Timeline</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-300 border-2 border-dashed border-primary-400"></span> Predicted</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stabilityPrediction}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predictGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Area type="monotone" dataKey="actual" stroke="#137fec" strokeWidth={2.5} fill="url(#actualGrad)" connectNulls={false} />
                <Area type="monotone" dataKey="predicted" stroke="#93c5fd" strokeWidth={2} strokeDasharray="6 3" fill="url(#predictGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Recommended Actions ─── */}
        <div className="col-span-5 glass-card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Recommended Actions</h2>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:border-primary-200 transition-colors">
                <span className="text-xl mt-0.5">{rec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                    <span className={cn(
                      'px-1.5 py-0.5 text-[9px] font-bold rounded',
                      rec.priority === 'High' ? 'bg-red-100 text-red-600' :
                        rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-50 text-primary-500'
                    )}>{rec.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rec.desc}</p>
                </div>
                <button className="p-1 text-gray-300 hover:text-primary-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── AI Health Chat ─── */}
        <div className="col-span-12 glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-sm">💬</span>
            <h2 className="text-base font-bold text-gray-900">Patient Health Q&A</h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">AI-Powered</span>
          </div>

          <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-2">
            {chat.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1">
                    AI
                  </div>
                )}
                <div className={cn(
                  'max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-md'
                )}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0 mt-1">
                    SC
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about fall risk, tremor patterns, medication efficacy..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
            <button
              onClick={sendMessage}
              className="px-5 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Ask AI
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {['What\'s the fall risk?', 'Tremor analysis', 'Medication update'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="px-3 py-1.5 text-xs text-primary-500 bg-primary-50 rounded-full hover:bg-primary-100 font-medium transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
