'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        // Redirect to appropriate dashboard
        if (userData.role === 'Doctor') {
          router.push('/doctor/dashboard');
        } else if (userData.role === 'Patient') {
          router.push('/patient/dashboard');
        }
      } catch (err) {
        // Invalid user data, go to login
        router.push('/auth/login');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <nav className="bg-white/90 backdrop-blur border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                MG
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MotionGuard AI</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/auth/login" className="px-5 py-2 text-blue-600 hover:text-blue-700 font-semibold">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 mb-5">
              Real-Time AI Health Monitoring
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Smarter doctor–patient
              <span className="text-blue-600"> motion care</span>
            </h2>
            <p className="text-lg text-gray-600 mt-5 max-w-xl">
              Track instability, receive alerts, and collaborate through a secure doctor-patient connection workflow with request approval.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/auth/register"
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
              >
                Create Account
              </Link>
              <Link
                href="/auth/login"
                className="px-7 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Connection Workflow</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</span>
                <p className="text-gray-700"><span className="font-semibold">Patient</span> sends request to a doctor from profile.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">2</span>
                <p className="text-gray-700"><span className="font-semibold">Doctor</span> reviews pending requests and approves.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">3</span>
                <p className="text-gray-700">Connection becomes active and dashboards sync with real data.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Monitoring</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">24/7</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Role-Based Access</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Doctor / Patient</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Insights</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Real-Time AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">For Doctors</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• Review and approve patient connection requests</li>
              <li>• View assigned patients in one place</li>
              <li>• Track alerts, adherence, and trends</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">For Patients</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• Send doctor connection requests directly</li>
              <li>• Follow realtime health monitoring status</li>
              <li>• Manage profile and emergency details</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">AI Engine</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• Stability analysis from telemetry stream</li>
              <li>• Fall-risk and anomaly indicators</li>
              <li>• Continuous DB-backed insights</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2026 MotionGuard AI</p>
          <p className="text-gray-500 text-sm mt-1">Secure, role-based motion monitoring platform</p>
        </div>
      </footer>
    </div>
  );
}
