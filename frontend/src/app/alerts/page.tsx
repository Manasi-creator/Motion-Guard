'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { RiskBadge, ToggleSwitch } from '@/components/ui/Cards';
import { cn, apiFetch, getSeverityColor } from '@/lib/utils';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(65);
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [telegramBot, setTelegramBot] = useState(true);
  const [emsDispatch, setEmsDispatch] = useState(false);

  useEffect(() => {
    apiFetch('/api/alerts').then(setAlerts).catch(() => setAlerts([]));
  }, []);

  const handleManualEmergency = async () => {
    try {
      await apiFetch('/api/alerts/manual-emergency', { method: 'POST' });
      // Refresh
      const updated = await apiFetch('/api/alerts');
      setAlerts(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout headerProps={{ showSearch: true, doctorName: 'Dr. Sarah Chen', doctorRole: 'Clinical Admin' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Configure incident responses and monitor historical patient events.</p>
        </div>
        <button
          onClick={handleManualEmergency}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          Manual Emergency Trigger
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Response Channels */}
        <div className="col-span-7 glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-blue-500">⚙️</span>
            <h2 className="text-base font-bold text-gray-900">Response Channels</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Voice Alerts */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Voice Alerts</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Audio broadcasts over facility intercom system.</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium', voiceAlerts ? 'text-green-600' : 'text-gray-400')}>
                  {voiceAlerts ? 'Enabled' : 'Disabled'}
                </span>
                <ToggleSwitch enabled={voiceAlerts} onChange={setVoiceAlerts} />
              </div>
            </div>

            {/* Telegram Bot */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Telegram Bot</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Instant mobile notifications to duty staff.</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium', telegramBot ? 'text-green-600' : 'text-gray-400')}>
                  {telegramBot ? 'Enabled' : 'Disabled'}
                </span>
                <ToggleSwitch enabled={telegramBot} onChange={setTelegramBot} />
              </div>
            </div>

            {/* EMS Dispatch */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">EMS Dispatch</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Direct link to local emergency services.</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium', emsDispatch ? 'text-green-600' : 'text-gray-400')}>
                  {emsDispatch ? 'Enabled' : 'Disabled'}
                </span>
                <ToggleSwitch enabled={emsDispatch} onChange={setEmsDispatch} />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="col-span-5 glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-400">🔒</span>
            <h2 className="text-base font-bold text-gray-900">Risk Thresholds</h2>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Stability Threshold</span>
              <span className="text-3xl font-bold text-gray-900">{threshold} <span className="text-sm font-normal text-gray-400">%</span></span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Trigger alarm below this value</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">ℹ️</span>
              <p className="text-xs text-blue-700 leading-relaxed">
                Lower thresholds reduce false alarms but may delay critical response. Clinical recommendation is 60-75% for general wards.
              </p>
            </div>
          </div>

          <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors">
            Update Parameters
          </button>
        </div>

        {/* Alert History Table */}
        <div className="col-span-8 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Alert History</h2>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action Taken</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <span className={cn('px-2.5 py-1 rounded-md text-[10px] font-bold uppercase', getSeverityColor(alert.severity))}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-medium text-gray-900">{alert.alert_type}</p>
                    <p className="text-xs text-gray-500">
                      Patient: {alert.patient_name || 'Unknown'} ({alert.room || 'N/A'})
                    </p>
                  </td>
                  <td className="py-4 text-sm text-gray-600">{alert.timestamp}</td>
                  <td className="py-4">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium',
                      alert.status === 'Resolved' ? 'text-green-600' : alert.status === 'Pending' ? 'text-red-500' : 'text-gray-500'
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        alert.status === 'Resolved' ? 'bg-green-500' : alert.status === 'Pending' ? 'bg-red-500' : 'bg-gray-400'
                      )}></span>
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-600">{alert.action_taken || '—'}</td>
                  <td className="py-4">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Emergency Contacts */}
        <div className="col-span-4 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Emergency Contacts</h2>
            <button className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg hover:bg-primary-600">+</button>
          </div>

          <div className="space-y-4">
            {/* Michael Chen */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">MC</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Michael Chen</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">On-Call Physician</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  📞 Call
                </button>
                <button className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  💬 SMS
                </button>
              </div>
            </div>

            {/* Sarah Williams */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">SW</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Sarah Williams</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Charge Nurse (Ward B)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  📞 Call
                </button>
                <button className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  💬 SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        <div>
          <p className="text-xs font-bold text-gray-600">SYSTEM STATUS</p>
          <p className="text-[10px] text-gray-400">Node Monitoring Active</p>
          <p className="text-[10px] text-gray-400">Uptime: 14d 6h 22m</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
