import { useCallback, useState } from 'react';

const API = 'http://localhost:8000';

export interface User {
  id?: string;
  email: string;
  name: string;
  role: 'Doctor' | 'Patient';
  avatar_url?: string;
  created_at?: string;
}

export interface DoctorProfile extends User {
  specialty: string;
  license_number: string;
  institution?: string;
  phone?: string;
  patients_count?: number;
}

export interface PatientProfile extends User {
  age: number;
  medical_conditions?: string[];
  emergency_contact?: string;
  emergency_phone?: string;
  phone?: string;
  assigned_doctor?: string;
}

export interface DoctorDirectoryItem {
  id: string;
  name: string;
  specialty: string;
  institution?: string;
}

export interface ConnectionRequest {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty?: string;
  note?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  const getUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }, []);

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };
      // Add base URL if url starts with /api
      const fullUrl = url.startsWith('/api') ? `http://localhost:8000${url}` : url;
      const response = await fetch(fullUrl, { ...options, headers });
      return response;
    },
    [getToken]
  );

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setUser(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setUser(null);
  }, []);

  return {
    user: user || getUser(),
    loading,
    error,
    getToken,
    getUser,
    fetchWithAuth,
    fetchProfile,
    logout,
  };
};
