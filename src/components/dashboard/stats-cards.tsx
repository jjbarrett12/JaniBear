'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { 
  AlertCircle, 
  MapPin, 
  ClipboardCheck, 
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
    recentWalkthroughs?: number;
    timeframes?: {
      inspectionsLast7Days: number;
      inspectionsLast30Days: number;
      inspectionsPrevious30Days: number;
      openIssuesNow: number;
      issuesResolvedLast7Days: number;
      issuesOpenedLast7Days: number;
    };
  };
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  }),
};

export function StatsCards({ stats }: StatsCardsProps) {
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const tf = stats.timeframes;

  // Inspections: use 30-day count when available; compute % change vs previous 30 days
  const inspectionsValue = tf ? tf.inspectionsLast30Days : stats.completedInspections;
  const inspectionsPrev = tf?.inspectionsPrevious30Days ?? 0;
  const inspectionsTrend =
    tf && inspectionsPrev > 0
      ? Math.round(((tf.inspectionsLast30Days - inspectionsPrev) / inspectionsPrev) * 100)
      : null;

  const cards = [
    {
      title: t('statsActiveLocations'),
      value: stats.totalLocations,
      timeframe: t('kpiTimeframeActiveNow'),
      icon: MapPin,
      href: '/app/accounts',
      gradient: 'from-blue-500 to-blue-600',
      comparison: null as string | null,
      trendPercent: null as number | null,
      trendUp: null as boolean | null,
    },
    {
      title: t('statsInspections'),
      value: inspectionsValue,
      timeframe: tf ? t('kpiTimeframeLast30Days') : undefined,
      subtitle: stats.avgScore ? `${stats.avgScore.toFixed(0)}% ${t('statsAvgScore')}` : undefined,
      icon: ClipboardCheck,
      href: '/app/inspections',
      gradient: 'from-emerald-500 to-emerald-600',
      comparison:
        tf && inspectionsPrev > 0
          ? t('kpiVsLastPeriod').replace('{{prev}}', String(inspectionsPrev))
          : null,
      trendPercent: inspectionsTrend,
      trendUp: inspectionsTrend !== null ? inspectionsTrend > 0 : null,
    },
    {
      title: t('statsOpenIssues'),
      value: stats.openIssues,
      timeframe: t('kpiTimeframeOpenNow'),
      subtitle:
        stats.totalIssues != null
          ? t('statsOfTotal').replace('{{total}}', String(stats.totalIssues))
          : undefined,
      icon: AlertCircle,
      href: '/app/issues?status=open',
      gradient: 'from-red-500 to-rose-600',
      comparison:
        tf && (tf.issuesOpenedLast7Days > 0 || tf.issuesResolvedLast7Days > 0)
          ? [
              tf.issuesOpenedLast7Days > 0
                ? t('kpiOpenedThisWeek').replace('{{count}}', String(tf.issuesOpenedLast7Days))
                : '',
              tf.issuesResolvedLast7Days > 0
                ? t('kpiResolvedThisWeek').replace('{{count}}', String(tf.issuesResolvedLast7Days))
                : '',
            ]
              .filter(Boolean)
              .join(' · ')
          : null,
      trendPercent: null,
      trendUp: null,
    },
    {
      title: t('statsCrews'),
      value: stats.totalCrews,
      timeframe: t('kpiTimeframeActiveNow'),
      icon: Users,
      href: '/app/crews',
      gradient: 'from-violet-500 to-purple-600',
      comparison: null,
      trendPercent: null,
      trendUp: null,
    },
    {
      title: t('statsPendingTasks'),
      value: stats.pendingTasks,
      timeframe: t('kpiTimeframePending'),
      icon: Clock,
      href: '/app/tasks',
      gradient: 'from-amber-500 to-amber-600',
      comparison: null,
      trendPercent: null,
      trendUp: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const showTrend = card.trendPercent !== null && card.trendUp !== null;
        return (
          <motion.div
            key={card.title}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Link href={card.href}>
              <Card className="group relative overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full bg-card">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                <CardContent className="p-4 pt-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {showTrend && (
                      <div
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          card.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {card.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{card.trendPercent !== 0 && card.trendUp ? '+' : ''}{card.trendPercent}%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {card.value.toLocaleString()}
                    </p>
                    {card.timeframe && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        {card.timeframe}
                      </p>
                    )}
                    {card.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
                    )}
                    {card.comparison && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        {card.comparison}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
