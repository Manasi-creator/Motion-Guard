'use client';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToggleSwitch } from '@/components/ui/Cards';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'Doctor' | 'Patient';

type WorkspacePrefs = {
  darkMode: boolean;
  criticalAlerts: boolean;
  privacyLevel: 'STANDARD' | 'ADVANCED' | 'STRICT';
};

const PREFS_KEY = 'motionguard_workspace_prefs';

export default function SettingsPage() {
  const { fetchWithAuth, getUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'Profile' | 'Workspace'>('Profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [role, setRole] = useState<UserRole>('Doctor');
  const [profile, setProfile] = useState<any>(null);
  const [doctorPatients, setDoctorPatients] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    institution: '',
    phone: '',
    age: '',
    medicalConditions: '',
    emergencyContact: '',
    emergencyPhone: '',
    avatarUrl: '',
  });

  const [prefs, setPrefs] = useState<WorkspacePrefs>({
    darkMode: false,
    criticalAlerts: true,
    privacyLevel: 'ADVANCED',
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    if (savedPrefs) {
      try {
        setPrefs(JSON.parse(savedPrefs));
      } catch {
        localStorage.removeItem(PREFS_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const localUser = getUser();
    if (localUser?.role === 'Patient') {
      setRole('Patient');
    } else {
      setRole('Doctor');
    }
  }, [getUser]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const meRes = await fetchWithAuth('/api/auth/me');
        if (!meRes.ok) {
          throw new Error('Failed to load user settings');
        }
        const me = await meRes.json();
        setProfile(me);

        const inferredRole: UserRole = getUser()?.role === 'Patient' ? 'Patient' : 'Doctor';
        setRole(inferredRole);

        setForm({
          name: me.name || '',
          specialty: me.specialty || '',
          institution: me.institution || '',
          phone: me.phone || '',
          age: me.age ? String(me.age) : '',
          medicalConditions: (me.medical_conditions || []).join(', '),
          emergencyContact: me.emergency_contact || '',
          emergencyPhone: me.emergency_phone || '',
          avatarUrl: me.avatar_url || '',
        });

        if (inferredRole === 'Doctor') {
          const localUser = getUser();
          if (localUser?.id) {
            const patientRes = await fetchWithAuth(`/api/doctor/${localUser.id}/patients`);
            if (patientRes.ok) {
              const patientData = await patientRes.json();
              setDoctorPatients(patientData);
            }
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Unable to load settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchWithAuth, getUser]);

  const initials = useMemo(() => {
    if (!form.name) return 'U';
    return form.name
      .split(' ')
      .map((x) => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [form.name]);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = role === 'Doctor' ? '/api/auth/doctor/profile' : '/api/auth/patient/profile';
      const payload =
        role === 'Doctor'
          ? {
              name: form.name,
              specialty: form.specialty,
              institution: form.institution || undefined,
              phone: form.phone || undefined,
              avatar_url: form.avatarUrl || undefined,
            }
          : {
              name: form.name,
              age: form.age ? Number(form.age) : undefined,
              phone: form.phone || undefined,
              medical_conditions: form.medicalConditions
                ? form.medicalConditions.split(',').map((x) => x.trim()).filter(Boolean)
                : undefined,
              emergency_contact: form.emergencyContact || undefined,
              emergency_phone: form.emergencyPhone || undefined,
              avatar_url: form.avatarUrl || undefined,
            };

      const res = await fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'Failed to save profile');
      }

      const updated = await res.json();
      setProfile(updated);
      setSuccess('Profile updated successfully.');

      const localUser = getUser();
      if (localUser) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...localUser,
            name: updated.name || localUser.name,
            avatar_url: updated.avatar_url || localUser.avatar_url,
          })
        );
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout headerProps={{ showSearch: true }}>
        <div className="glass-card p-6 text-sm text-gray-600">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout headerProps={{ showSearch: true }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and workspace preferences.</p>
      </div>

      {(error || success) && (
        <div className="mb-4 space-y-2">
          {error && <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
          {success && <div className="px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">{success}</div>}
        </div>
      )}

      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        {(['Profile', 'Workspace'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === tab ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Profile' ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 glass-card p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg">
                {initials}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-3">{form.name || 'User'}</h2>
              <p className="text-sm text-primary-500 font-medium">{role}</p>
              <p className="text-xs text-gray-500">{profile?.email || '-'}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Created</p>
                <p className="text-gray-700 mt-0.5">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              {role === 'Doctor' ? (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Patients</p>
                  <p className="text-gray-700 mt-0.5">{profile?.patients_count ?? doctorPatients.length}</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Doctor</p>
                  <p className="text-gray-700 mt-0.5">{profile?.assigned_doctor || 'Not assigned yet'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-8 glass-card p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Profile Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Email (read-only)</label>
                <input value={profile?.email || ''} readOnly className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Avatar URL</label>
                <input
                  value={form.avatarUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>

              {role === 'Doctor' ? (
                <>
                  <div>
                    <label className="text-xs text-gray-500">Specialty</label>
                    <input
                      value={form.specialty}
                      onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Institution</label>
                    <input
                      value={form.institution}
                      onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-500">Age</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Emergency Contact</label>
                    <input
                      value={form.emergencyContact}
                      onChange={(e) => setForm((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Emergency Phone</label>
                    <input
                      value={form.emergencyPhone}
                      onChange={(e) => setForm((prev) => ({ ...prev, emergencyPhone: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Medical Conditions (comma-separated)</label>
                    <input
                      value={form.medicalConditions}
                      onChange={(e) => setForm((prev) => ({ ...prev, medicalConditions: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {role === 'Doctor' && (
            <div className="col-span-12 glass-card p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Assigned Patients</h2>
              {doctorPatients.length === 0 ? (
                <p className="text-sm text-gray-500">No patients assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {doctorPatients.map((patient) => (
                    <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{patient.email}</p>
                      <p className="text-xs text-gray-500">Age: {patient.age || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Workspace Preferences</h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                <p className="text-xs text-gray-500">Stored locally for your account on this device.</p>
              </div>
              <ToggleSwitch enabled={prefs.darkMode} onChange={(value) => setPrefs((prev) => ({ ...prev, darkMode: value }))} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Critical Alert Notifications</p>
                <p className="text-xs text-gray-500">Local preference for high-priority notification prompts.</p>
              </div>
              <ToggleSwitch
                enabled={prefs.criticalAlerts}
                onChange={(value) => setPrefs((prev) => ({ ...prev, criticalAlerts: value }))}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Data Privacy Level</p>
              <div className="grid grid-cols-3 gap-3">
                {(['STANDARD', 'ADVANCED', 'STRICT'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setPrefs((prev) => ({ ...prev, privacyLevel: level }))}
                    className={cn(
                      'py-3 rounded-xl text-sm font-semibold transition-all border-2',
                      prefs.privacyLevel === level
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Preferences are saved automatically.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
