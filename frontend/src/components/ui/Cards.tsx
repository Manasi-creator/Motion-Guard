'use client';
import React from 'react';
import { cn, getRiskColor } from '@/lib/utils';

// ─── Stat Card ─────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  subtitleColor?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, unit, subtitle, subtitleColor, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('glass-card p-5', className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {trend && (
        <p className={cn('text-xs mt-1 font-medium', trend.positive ? 'text-green-600' : 'text-red-500')}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
      {subtitle && (
        <p className={cn('text-xs mt-1', subtitleColor || 'text-gray-500')}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── Risk Level Badge ──────────────────────────────────────
interface RiskBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function RiskBadge({ level, size = 'md', animated = false }: RiskBadgeProps) {
  const colors = getRiskColor(level);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-md',
        colors.bg,
        colors.text,
        sizeClasses[size],
        animated && (level === 'CRITICAL' || level === 'HIGH') && 'risk-flash'
      )}
    >
      {level}
    </span>
  );
}

// ─── Circular Risk Indicator ───────────────────────────────
interface CircularRiskProps {
  level: string;
  label?: string;
}

export function CircularRiskIndicator({ level, label }: CircularRiskProps) {
  const colorMap: Record<string, string> = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  const color = colorMap[level] || '#22c55e';
  const isHighRisk = level === 'CRITICAL' || level === 'HIGH';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', isHighRisk && 'pulse-ring')}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center border-4"
          style={{ borderColor: color, backgroundColor: `${color}10` }}
        >
          <svg className="w-8 h-8" style={{ color }} fill="currentColor" viewBox="0 0 24 24">
            {level === 'LOW' ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            )}
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase">Active Risk Level</p>
        <p className="text-lg font-bold" style={{ color }}>
          {level} {level === 'LOW' && '/ STABLE'}
        </p>
      </div>
    </div>
  );
}

// ─── Stability Score Ring ──────────────────────────────────
interface StabilityRingProps {
  score: number;
  size?: number;
  change?: string;
}

export function StabilityRing({ score, size = 80, change }: StabilityRingProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{Math.round(score)}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase mt-1">Stability Score</p>
      {change && (
        <p className={cn('text-xs font-medium', change.startsWith('+') ? 'text-green-600' : 'text-red-500')}>
          {change} vs yesterday
        </p>
      )}
    </div>
  );
}

// ─── Sensor Status Card ────────────────────────────────────
interface SensorStatusProps {
  name: string;
  status: 'Connected' | 'Disconnected';
  latency?: string;
  signalStrength?: number;
  signalLabel?: string;
}

export function SensorStatusCard({ name, status, latency, signalStrength = 3, signalLabel }: SensorStatusProps) {
  const isConnected = status === 'Connected';
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-medium', isConnected ? 'text-green-600' : 'text-red-500')}>
          ● {status}
        </span>
      </div>
    </div>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

export function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-primary-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}
