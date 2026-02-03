'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface Proposal {
  id: string;
  lead_name: string;
  company_name?: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
}

interface PipelineWidgetProps {
  proposals: Proposal[];
  totalValue: number;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Clock },
  accepted: { label: 'Won', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Lost', color: 'bg-red-100 text-red-700', icon: null },
};

export function PipelineWidget({ proposals, totalValue }: PipelineWidgetProps) {
  const pendingProposals = proposals.filter(p => p.status === 'draft' || p.status === 'sent');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Sales Pipeline
            </CardTitle>
            <p className="text-sm text-gray-500">Active proposals</p>
          </div>
          <Link href="/app/sales/leads/new">
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">
              <Plus className="h-4 w-4 mr-1" />
              New Lead
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pipeline Value */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500 shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Pipeline Value</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>

          {/* Proposals List */}
          <div className="space-y-2">
            {pendingProposals.length > 0 ? (
              pendingProposals.slice(0, 4).map((proposal) => {
                const status = statusConfig[proposal.status];
                return (
                  <Link key={proposal.id} href={`/app/sales/proposals/${proposal.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                          {proposal.company_name || proposal.lead_name}
                        </p>
                        <p className="text-sm text-gray-500">{formatCurrency(proposal.total_amount)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={status.color}>
                          {status.label}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No pending proposals</p>
                <Link href="/app/walkthroughs/new">
                  <Button variant="outline" size="sm">
                    Start a Walkthrough
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {pendingProposals.length > 4 && (
            <Link href="/app/sales" className="block">
              <Button variant="ghost" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                View All Proposals
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
