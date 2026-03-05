'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SectionHeader } from './SectionHeader';
import type { OperationsPerformance } from '../types';

interface OperationsPerformanceCardProps {
  data: OperationsPerformance;
  rightAction?: React.ReactNode;
}

function formatScoreTrend(data: number[]) {
  return data.map((v, i) => ({ name: `W${i + 1}`, score: v }));
}

function formatCrewUtil(data: number[]) {
  return data.map((v, i) => ({ name: `Day ${i + 1}`, util: v }));
}

function formatIssuesTrend(data: number[]) {
  return data.map((v, i) => ({ name: `Day ${i + 1}`, count: v }));
}

export function OperationsPerformanceCard({
  data,
  rightAction,
}: OperationsPerformanceCardProps) {
  const scoreData = formatScoreTrend(data.inspectionScoreTrend);
  const crewData = formatCrewUtil(data.crewUtilization);
  const issuesData = formatIssuesTrend(data.openIssuesTrend);

  return (
    <div className="rounded-2xl bg-[#0B1220]/70 backdrop-blur border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] p-6">
      <SectionHeader title="Operations Performance" rightAction={rightAction} />
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
            Inspection score trend
          </p>
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="execScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                  formatter={(v: number) => [v, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#execScoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
            Crew utilization %
          </p>
          <div className="h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crewData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(v: number) => [`${v}%`, 'Utilization']}
                />
                <Bar dataKey="util" fill="#f59e0b" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
            Open issues trend
          </p>
          <div className="h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={issuesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="execIssuesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(v: number) => [v, 'Open issues']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#execIssuesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
