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
  };
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

export function StatsCards({ stats }: StatsCardsProps) {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  const cards = [
    {
      title: t('statsActiveLocations'),
      value: stats.totalLocations,
      icon: MapPin,
      href: '/app/locations',
      gradient: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      trend: null,
      subtitle: undefined as string | undefined,
    },
    {
      title: t('statsInspections'),
      value: stats.completedInspections,
      subtitle: stats.avgScore ? `${stats.avgScore.toFixed(0)}% ${t('statsAvgScore')}` : undefined,
      icon: ClipboardCheck,
      href: '/app/inspections',
      gradient: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      trend: { value: 12, positive: true },
    },
    {
      title: t('statsOpenIssues'),
      value: stats.openIssues,
      subtitle: stats.totalIssues != null ? t('statsOfTotal').replace('{{total}}', String(stats.totalIssues)) : undefined,
      icon: AlertCircle,
      href: '/app/issues?status=open',
      gradient: 'from-red-500 to-rose-600',
      lightBg: 'bg-red-50',
      trend: stats.openIssues > 0 ? { value: stats.openIssues, positive: false } : null,
    },
    {
      title: t('statsCrews'),
      value: stats.totalCrews,
      icon: Users,
      href: '/app/crews',
      gradient: 'from-violet-500 to-purple-600',
      lightBg: 'bg-violet-50',
      trend: null,
      subtitle: undefined as string | undefined,
    },
    {
      title: t('statsPendingTasks'),
      value: stats.pendingTasks,
      icon: Clock,
      href: '/app/tasks',
      gradient: 'from-amber-500 to-amber-600',
      lightBg: 'bg-amber-50',
      trend: null,
      subtitle: undefined as string | undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Link href={card.href}>
              <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white dark:bg-gray-800">
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                
                <CardContent className="p-4 pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {card.trend && (
                      <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {card.trend.positive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{card.trend.value}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {card.value.toLocaleString()}
                    </p>
                    {card.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
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
