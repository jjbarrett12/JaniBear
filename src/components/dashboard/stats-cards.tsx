'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  MapPin, 
  ClipboardCheck, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    openIssues: number;
    totalLocations: number;
    recentInspections: number;
    completedInspections: number;
    pendingTasks: number;
    totalCrews: number;
    avgScore?: number;
    totalIssues?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Open Issues',
      value: stats.openIssues,
      icon: AlertCircle,
      href: '/app/issues?status=open',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: stats.totalIssues ? `${Math.round((stats.openIssues / stats.totalIssues) * 100)}% of total` : undefined,
    },
    {
      title: 'Locations',
      value: stats.totalLocations,
      icon: MapPin,
      href: '/app/locations',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Recent Inspections',
      value: stats.recentInspections,
      icon: ClipboardCheck,
      href: '/app/inspections',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed',
      value: stats.completedInspections,
      icon: CheckCircle2,
      href: '/app/inspections?status=completed',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: Clock,
      href: '/app/tasks?status=pending',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Crews',
      value: stats.totalCrews,
      icon: Users,
      href: '/app/crews',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {card.value}
                </div>
                {card.change && (
                  <p className="text-xs text-gray-500 mt-1">{card.change}</p>
                )}
                {card.title === 'Recent Inspections' && stats.avgScore && (
                  <p className="text-xs text-gray-500 mt-1">
                    Avg Score: {stats.avgScore.toFixed(1)}%
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
