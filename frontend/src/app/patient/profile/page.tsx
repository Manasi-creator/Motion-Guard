'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, PatientProfile, DoctorDirectoryItem, ConnectionRequest } from '@/hooks/useAuth';
import Link from 'next/link';

export default function PatientProfilePage() {
  const router = useRouter();
  const { user, getToken, fetchWithAuth, logout } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<DoctorDirectoryItem[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [requestNote, setRequestNote] = useState('');

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    medical_conditions: '',
    emergency_contact: '',
    emergency_phone: '',
    phone: '',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchPatientProfile();
    fetchConnectionData();
  }, []);

  const fetchPatientProfile = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name,
        age: data.age?.toString() || '',
        medical_conditions: (data.medical_conditions || []).join(', '),
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: formData.name,
        age: parseInt(formData.age) || undefined,
        medical_conditions: formData.medical_conditions
          ? formData.medical_conditions.split(',').map((c) => c.trim())
          : undefined,
        emergency_contact: formData.emergency_contact || undefined,
        emergency_phone: formData.emergency_phone || undefined,
        phone: formData.phone || undefined,
      };

      const response = await fetchWithAuth('/api/auth/patient/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const fetchConnectionData = async () => {
    try {
      const [doctorsRes, requestsRes] = await Promise.all([
        fetchWithAuth('/api/doctors/directory'),
        fetchWithAuth('/api/connections/patient/requests'),
      ]);

      if (doctorsRes.ok) {
        const doctors = await doctorsRes.json();
        setAvailableDoctors(doctors);
      }

      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setConnectionRequests(requests);
      }
    } catch (err) {
      console.error('Failed to load connection data:', err);
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedDoctorId) {
      setError('Please select a doctor first.');
      return;
    }

    setSubmittingRequest(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchWithAuth('/api/connections/request', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          note: requestNote.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to send request');
      }

      setSelectedDoctorId('');
      setRequestNote('');
      setSuccess('Connection request sent successfully.');
      await fetchConnectionData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send request';
      setError(message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load profile</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              {profile.name.charAt(0)}
            </div>
            <h1 className="text-xl font-bold text-gray-900">MotionGuard AI - Patient</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/patient/dashboard"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Personal Profile</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editing
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {/* Profile Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile.name}
                  </h3>
                  <p className="text-gray-600">{profile.age} years old</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.age}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions (comma-separated)
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.medical_conditions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medical_conditions: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Diabetes, Hypertension"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profile.medical_conditions?.length
                        ? profile.medical_conditions.join(', ')
                        : 'None'}
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.emergency_contact}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              emergency_contact: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.emergency_contact || 'N/A'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData.emergency_phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              emergency_phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.emergency_phone || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {editing && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Doctor Assignment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Assigned Doctor
              </h3>
              {profile.assigned_doctor ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">Connected</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Your assigned healthcare provider
                  </p>
                  <p className="text-sm text-blue-700 break-all">Doctor ID: {profile.assigned_doctor}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      No doctor connected yet. Send a connection request and wait for approval.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a doctor</option>
                      {availableDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} • {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
                    <textarea
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a brief message for the doctor"
                    />
                  </div>
                  <button
                    onClick={handleSendConnectionRequest}
                    disabled={submittingRequest}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    {submittingRequest ? 'Sending...' : 'Send Connection Request'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request History</h3>
              {connectionRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No connection requests yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {connectionRequests.slice(0, 8).map((request) => (
                    <div key={request.id} className="p-3 border border-gray-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900">{request.doctor_name}</p>
                      <p className="text-xs text-gray-500">{request.doctor_specialty || 'Doctor'}</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            request.status === 'Approved'
                              ? 'bg-green-100 text-green-700'
                              : request.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {request.status}
                        </span>
                        <span className="text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Member Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Member Since</p>
                  <p className="font-semibold text-gray-900">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Account Type</p>
                  <p className="font-semibold text-gray-900">Patient</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-900 font-medium transition-colors">
                  📋 View Health Records
                </button>
                <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-900 font-medium transition-colors">
                  📊 View Analytics
                </button>
                <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-900 font-medium transition-colors">
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
