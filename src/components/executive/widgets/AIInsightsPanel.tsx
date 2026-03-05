'use client';

import Link from 'next/link';
import { Sparkles, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import type { AIInsight } from '../types';

function getIcon(severity?: AIInsight['severity']) {
  if (severity === 'risk') return AlertCircle;
  if (severity === 'opportunity') return TrendingUp;
  return Info;
}

function getIconClass(severity?: AIInsight['severity']) {
  if (severity === 'risk') return 'text-rose-400';
  if (severity === 'opportunity') return 'text-emerald-400';
  return 'text-blue-400';
}

function AIInsightCard({ insight }: { insight: AIInsight }) {
  const Icon = getIcon(insight.severity);
  const iconClass = getIconClass(insight.severity);

  return (
    <div className="rounded-xl bg-[#0F172A]/60 border border-white/10 p-4 hover:border-white/15 transition-colors">
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconClass}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
          <p className="text-sm text-white/70 mt-1">{insight.explanation}</p>
          <p className="text-xs text-white/60 mt-2">
            <span className="font-medium text-white/80">Recommended:</span>{' '}
            {insight.recommendation}
          </p>
          <Button
            asChild
            size="sm"
            className="mt-3 bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <Link href={insight.actionHref}>{insight.actionLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
  rightAction?: React.ReactNode;
}

export function AIInsightsPanel({ insights, rightAction }: AIInsightsPanelProps) {
  return (
    <div className="rounded-2xl bg-[#0B1220]/70 backdrop-blur border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] p-6 h-full flex flex-col">
      <SectionHeader
        title="AI Insights"
        rightAction={
          rightAction ?? (
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Powered by JANIBEAR
            </span>
          )
        }
      />
      <div className="space-y-3 flex-1 overflow-auto">
        {insights.map((insight) => (
          <AIInsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}
