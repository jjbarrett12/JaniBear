'use client';

import { useState } from 'react';
import type { AiOrgConfigRow, AiModuleStateRow, AiAutomationRuleRow, AiAuditLogRow } from '@/app/app/settings/ai/types';
import { UsageBudgetCard } from '@/components/ai/UsageBudgetCard';
import { ModuleGrid } from '@/components/ai/ModuleGrid';
import { RulesTable } from '@/components/ai/RulesTable';
import { PrivacyPanel } from '@/components/ai/PrivacyPanel';
import { ModelConfigPanel } from '@/components/ai/ModelConfigPanel';
import { ProviderKeysPanel } from '@/components/ai/ProviderKeysPanel';
import { AuditLogPanel } from '@/components/ai/AuditLogPanel';
import { Badge } from '@/components/ui/badge';

export interface AiControlCenterPageProps {
  orgId: string;
  initialConfig: AiOrgConfigRow | null;
  initialModules: AiModuleStateRow[];
  initialRules: AiAutomationRuleRow[];
  initialAuditLog?: AiAuditLogRow[];
  initialUsage: { period: string; tokensUsed: number; costCents: number; budgetCents: number | null };
}

function formatCost(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
}

export function AiControlCenterPage({
  orgId,
  initialConfig,
  initialModules,
  initialRules,
  initialAuditLog = [],
  initialUsage,
}: AiControlCenterPageProps) {
  const [config, setConfig] = useState<AiOrgConfigRow | null>(initialConfig);
  const [modules, setModules] = useState<AiModuleStateRow[]>(initialModules);
  const [rules, setRules] = useState<AiAutomationRuleRow[]>(initialRules);
  const [auditLog] = useState<AiAuditLogRow[]>(initialAuditLog);
  const [usage, setUsage] = useState(initialUsage);

  const aiEnabled = config?.ai_enabled ?? true;

  return (
    <div className="space-y-8 pb-8">
      {/* A) Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
            AI Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control AI features, automation rules, privacy, and spending
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={aiEnabled ? 'default' : 'secondary'}>
            AI {aiEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {usage.tokensUsed > 0 || usage.costCents > 0 ? `${formatCost(usage.costCents)} · ${(usage.tokensUsed / 1000).toFixed(1)}k tokens` : '—'}
          </Badge>
          <UsageLogButton />
        </div>
      </div>

      {/* 2) Usage & Budget Card */}
      <UsageBudgetCard
        orgId={orgId}
        period={usage.period}
        tokensUsed={usage.tokensUsed}
        costCents={usage.costCents}
        budgetCents={usage.budgetCents}
        hardCapEnabled={config?.budget_hard_cap ?? false}
        notifyAtPercent={config?.notify_at_percent ?? 80}
        notifyChannel={(config?.notify_channel as 'in_app' | 'email' | 'slack') ?? 'in_app'}
        onConfigChange={(patch) => setConfig((c) => (c ? { ...c, ...patch } : c))}
      />

      {/* C) Active Modules */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Active Modules</h2>
        <ModuleGrid
          orgId={orgId}
          modules={modules}
          config={config}
          onModulesChange={setModules}
        />
      </section>

      {/* D) Automation Rules */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Automation Rules</h2>
        <RulesTable orgId={orgId} rules={rules} onRulesChange={setRules} />
      </section>

      {/* E) Data Access & Privacy */}
      <PrivacyPanel orgId={orgId} config={config} onConfigChange={setConfig} />

      {/* F) Model Configuration */}
      <ModelConfigPanel orgId={orgId} config={config} onConfigChange={setConfig} />

      {/* G) API Keys & Provider */}
      <ProviderKeysPanel orgId={orgId} config={config} onConfigChange={setConfig} />

      {/* H) Audit Log */}
      <AuditLogPanel auditLog={auditLog} />
    </div>
  );
}
