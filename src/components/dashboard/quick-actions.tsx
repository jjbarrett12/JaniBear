'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { 
  ClipboardCheck, 
  MapPin, 
  Users, 
  Calendar,
  FileText,
  Camera,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function QuickActions() {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  const actions = [
    { labelKey: 'quickNewWalkthrough' as const, descKey: 'quickNewWalkthroughDesc' as const, href: '/app/walkthroughs/new', icon: Camera, gradient: 'from-amber-500 to-rose-500', primary: true },
    { labelKey: 'quickStartInspection' as const, descKey: 'quickStartInspectionDesc' as const, href: '/app/inspections/start', icon: ClipboardCheck, gradient: 'from-emerald-500 to-teal-500', primary: false },
    { labelKey: 'quickAddLocation' as const, descKey: 'quickAddLocationDesc' as const, href: '/app/accounts/new', icon: MapPin, gradient: 'from-blue-500 to-indigo-500', primary: false },
    { labelKey: 'quickCreateCrew' as const, descKey: 'quickCreateCrewDesc' as const, href: '/app/crews/new', icon: Users, gradient: 'from-violet-500 to-purple-500', primary: false },
    { labelKey: 'quickNewSchedule' as const, descKey: 'quickNewScheduleDesc' as const, href: '/app/schedules/new', icon: Calendar, gradient: 'from-cyan-500 to-blue-500', primary: false },
    { labelKey: 'quickNewProposal' as const, descKey: 'quickNewProposalDesc' as const, href: '/app/sales/leads/new', icon: FileText, gradient: 'from-amber-500 to-orange-500', primary: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              {t('quickActions')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + index * 0.03, duration: 0.2 }}
                    className={`
                      relative group p-4 rounded-2xl border transition-all duration-150 cursor-pointer
                      ${action.primary
                        ? 'bg-primary text-primary-foreground border-primary hover:opacity-95'
                        : 'bg-card border-border hover:border-muted-foreground/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center mb-3
                      ${action.primary ? 'bg-primary-foreground/20' : 'bg-muted/60 text-muted-foreground'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={`font-semibold text-sm ${action.primary ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {t(action.labelKey)}
                    </p>
                    <p className={`text-xs mt-0.5 ${action.primary ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                      {t(action.descKey)}
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
