'use client';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  headerProps?: any;
}

export default function DashboardLayout({ children, headerProps }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (!token || !userRaw) {
      router.replace('/auth/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userRaw);
      setUser(parsedUser);
      setReady(true);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/auth/login');
    }
  }, [router, pathname]);

  const mergedHeaderProps = useMemo(() => {
    if (!user) return headerProps;
    return {
      ...headerProps,
      doctorName: user.name,
      doctorRole: user.role,
      patientName: user.role === 'Patient' ? user.name : (headerProps?.patientName || 'Arthur Miller'),
      patientId: user.role === 'Patient' ? (user.id || 'N/A') : (headerProps?.patientId || '#8821'),
    };
  }, [headerProps, user]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[200px]">
        <Header {...mergedHeaderProps} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
