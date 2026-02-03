'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
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

const actions = [
  {
    label: 'New Walkthrough',
    description: 'Start a site assessment',
    href: '/app/walkthroughs/new',
    icon: Camera,
    gradient: 'from-orange-500 to-rose-500',
    primary: true,
  },
  {
    label: 'Start Inspection',
    description: 'Run quality check',
    href: '/app/inspections/start',
    icon: ClipboardCheck,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Add Location',
    description: 'New service location',
    href: '/app/locations/new',
    icon: MapPin,
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    label: 'Create Crew',
    description: 'Add team members',
    href: '/app/crews/new',
    icon: Users,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    label: 'New Schedule',
    description: 'Plan services',
    href: '/app/schedules/new',
    icon: Calendar,
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    label: 'New Proposal',
    description: 'Create quote',
    href: '/app/sales/leads/new',
    icon: FileText,
    gradient: 'from-amber-500 to-orange-500',
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`
                      relative group p-4 rounded-xl border transition-all duration-200 cursor-pointer
                      ${action.primary 
                        ? 'bg-gradient-to-br from-orange-500 to-rose-500 border-transparent text-white hover:shadow-lg hover:shadow-orange-500/25' 
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mb-3
                      ${action.primary 
                        ? 'bg-white/20' 
                        : `bg-gradient-to-br ${action.gradient} shadow-md`
                      }
                    `}>
                      <Icon className={`h-5 w-5 ${action.primary ? 'text-white' : 'text-white'}`} />
                    </div>
                    <p className={`font-semibold text-sm ${action.primary ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {action.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${action.primary ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {action.description}
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
