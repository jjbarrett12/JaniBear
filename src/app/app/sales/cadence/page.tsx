import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MessageCircle, Linkedin, Calendar } from 'lucide-react';
import { DEFAULT_10_TOUCH_CADENCE, CHANNEL_LABELS } from '@/lib/sales-cadence-defaults';

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  call: Phone,
  linkedin: Linkedin,
  sms: MessageCircle,
  meeting: Calendar,
};

export default async function SalesCadencePage() {
  const org = await requireOrg();
  const supabase = await createClient();

  let { data: templates } = await supabase
    .from('sales_cadence_templates')
    .select('id, name, is_default')
    .eq('org_id', org.org_id)
    .order('is_default', { ascending: false });

  if (!templates || templates.length === 0) {
    const { data: newTemplate } = await supabase
      .from('sales_cadence_templates')
      .insert({ org_id: org.org_id, name: 'Default 10-Touch Cadence', is_default: true })
      .select('id')
      .single();
    if (newTemplate) {
      for (const step of DEFAULT_10_TOUCH_CADENCE) {
        await supabase.from('sales_cadence_steps').insert({
          template_id: newTemplate.id,
          step_number: step.step_number,
          channel: step.channel,
          delay_days: step.delay_days,
          subject: step.subject ?? null,
          body_template: step.body_template ?? null,
          call_script: step.call_script ?? null,
        });
      }
      templates = [{ id: newTemplate.id, name: 'Default 10-Touch Cadence', is_default: true }];
    }
  }

  const templateId = templates?.[0]?.id;
  let steps: { step_number: number; channel: string; delay_days: number; subject: string | null; body_template: string | null; call_script: string | null }[] = [];
  if (templateId) {
    const { data: stepsData } = await supabase
      .from('sales_cadence_steps')
      .select('step_number, channel, delay_days, subject, body_template, call_script')
      .eq('template_id', templateId)
      .order('step_number', { ascending: true });
    steps = stepsData || [];
  }

  if (steps.length === 0) {
    steps = DEFAULT_10_TOUCH_CADENCE.map((s) => ({
      step_number: s.step_number,
      channel: s.channel,
      delay_days: s.delay_days,
      subject: s.subject ?? null,
      body_template: s.body_template ?? null,
      call_script: s.call_script ?? null,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/sales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Sales Cadence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            10-touch sequence for your sales team – email, call, LinkedIn, and more
          </p>
        </div>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg dark:text-white">
              {templates?.[0]?.name ?? 'Default 10-Touch Cadence'}
            </CardTitle>
            {templates?.[0]?.is_default && (
              <Badge variant="secondary">Default</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enroll leads from their profile to start this sequence. Log each touch to track progress.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = channelIcons[step.channel] ?? Mail;
              const label = CHANNEL_LABELS[step.channel] ?? step.channel;
              return (
                <div
                  key={step.step_number}
                  className="flex gap-4 p-4 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-bold text-primary">{step.step_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-foreground">
                        Touch {step.step_number}: {label}
                      </span>
                      {step.delay_days > 0 && (
                        <span className="text-xs text-gray-500">
                          +{step.delay_days} day{step.delay_days !== 1 ? 's' : ''} after previous
                        </span>
                      )}
                    </div>
                    {step.subject && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        Subject: {step.subject}
                      </p>
                    )}
                    {step.call_script && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {step.call_script}
                      </p>
                    )}
                    {step.body_template && !step.subject && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {step.body_template.replace(/\{\{[^}]+\}\}/g, '…').slice(0, 120)}…
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        To enroll a lead in this cadence, open the lead and use &quot;Enroll in cadence&quot;. Log each touch (email sent, call made) to advance the sequence and keep the team on track.
      </p>
    </div>
  );
}
