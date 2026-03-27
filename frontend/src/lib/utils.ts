import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export function getRiskColor(level: string) {
  switch (level?.toUpperCase()) {
    case 'LOW': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' };
    case 'MEDIUM': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' };
    case 'HIGH': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' };
    case 'CRITICAL': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' };
  }
}

export function getSeverityColor(severity: string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500 text-white';
    case 'WARNING': return 'bg-orange-500 text-white';
    case 'INFO': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export function formatTimestamp(ts: number | string) {
  if (typeof ts === 'number') {
    return new Date(ts * 1000).toLocaleTimeString();
  }
  return ts;
}
