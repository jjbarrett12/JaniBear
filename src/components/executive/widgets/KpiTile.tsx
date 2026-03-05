'use client';

import Link from 'next/link';
import {
  DollarSign,
  Building2,
  Users,
  ClipboardCheck,
  AlertTriangle,
  ClipboardX,
  type LucideIcon,
} from 'lucide-react';
import { Sparkline } from '@/components/charts/Sparkline';
import type { KpiTileData, KpiAccent } from '../types';

const ACCENT_ICONS: Record<KpiAccent, LucideIcon> = {
  emerald: DollarSign,
  blue: Building2,
  violet: ClipboardCheck,
  amber: Users,
  rose: AlertTriangle,
};

const ACCENT_GLOW: Record<KpiAccent, string> = {
  emerald: 'from-emerald-500/25 to-emerald-400/5',
  blue: 'from-blue-500/25 to-blue-400/5',
  violet: 'from-violet-500/25 to-violet-400/5',
  amber: 'from-amber-500/25 to-amber-400/5',
  rose: 'from-rose-500/25 to-rose-400/5',
};

const ACCENT_STROKE: Record<KpiAccent, string> = {
  emerald: 'rgb(16 185 129)',
  blue: 'rgb(59 130 246)',
  violet: 'rgb(139 92 246)',
  amber: 'rgb(245 158 11)',
  rose: 'rgb(244 63 94)',
};

export function KpiTile({
  title,
  value,
  subvalue,
  subvalueSecondary,
  subvalueTertiary,
  deltaText,
  deltaPositive,
  accent,
  sparkData,
  href,
  badges,
  criticalBadge,
  criticalIndicator,
  icon,
  tooltipContent,
}: KpiTileData) {
  const Icon = (icon === 'ClipboardX' ? ClipboardX : ACCENT_ICONS[accent]) as LucideIcon;
  const glowClass = ACCENT_GLOW[accent];
  const strokeColor = ACCENT_STROKE[accent];

  const content = (
    <>
      {criticalIndicator ? (
        <span
          className="absolute top-3 right-3 z-20 flex h-2 w-2"
          aria-label="Critical items need attention"
        >
          <span className="absolute inline-flex h-2 w-2 w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
      ) : null}
      {/* Halo glow behind card */}
      <div
        className={`absolute -inset-1 rounded-2xl blur-2xl bg-gradient-to-br ${glowClass} opacity-30 pointer-events-none transition-opacity duration-200 group-hover:opacity-50`}
        aria-hidden
      />
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${glowClass} opacity-100 pointer-events-none transition-opacity duration-200 group-hover:opacity-100`}
        aria-hidden
      />
      <div className="relative z-10 flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider truncate">
              {title}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-white truncate">
            {value}
          </p>
          {(subvalue || criticalBadge) ? (
            <p className="text-xs text-white/60 mt-0.5 flex items-center gap-1.5 flex-wrap">
              {subvalue}
              {criticalBadge ? (
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {criticalBadge.value} {criticalBadge.label}
                </span>
              ) : null}
            </p>
          ) : null}
          {subvalueSecondary ? (
            <p className="text-xs text-white/50 mt-0.5">{subvalueSecondary}</p>
          ) : null}
          {subvalueTertiary ? (
            <p className="text-xs text-white/45 mt-0.5 truncate">{subvalueTertiary}</p>
          ) : null}
          {deltaText ? (
            <p
              className={`text-xs mt-1 ${
                deltaPositive === true
                  ? 'text-emerald-400/80'
                  : deltaPositive === false
                    ? 'text-amber-400/80'
                    : 'text-white/50'
              }`}
            >
              {deltaText}
            </p>
          ) : null}
          {badges && badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-white/15 text-white/90 border border-white/20"
                >
                  {b.value} {b.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 w-20 h-9 flex items-end justify-end">
          <Sparkline
            data={sparkData}
            width={80}
            height={36}
            stroke={strokeColor}
            strokeWidth={1.5}
            fillOpacity={0.2}
          />
        </div>
      </div>
    </>
  );

  const wrapperClass =
    'relative rounded-2xl bg-[#0F172A]/80 border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-200 group hover:translate-y-[-2px] hover:border-white/20 hover:shadow-[0_14px_40px_-10px_rgba(0,0,0,0.7)]' +
    (href ? ' cursor-pointer' : '');
  const wrapperProps = { className: wrapperClass, title: tooltipContent };

  if (href) {
    return (
      <Link href={href} {...wrapperProps}>
        {content}
      </Link>
    );
  }

  return <div {...wrapperProps}>{content}</div>;
}
