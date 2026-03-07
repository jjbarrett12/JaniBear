/**
 * Cron run tracking for production. Records job name, started_at, finished_at, status, error summary, metadata.
 * Use wrapCronHandler or recordCronRun/recordCronFailure in cron route handlers.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from './logger';

export type CronStatus = 'running' | 'success' | 'failure';

export interface CronRunRecord {
  job_name: string;
  started_at: string;
  finished_at?: string;
  status: CronStatus;
  error_summary?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Insert a cron run row (status running). Returns id for later update. */
export async function startCronRun(jobName: string, metadata?: Record<string, unknown>): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('cron_runs')
      .insert({
        job_name: jobName,
        status: 'running',
        metadata: metadata ?? null,
      })
      .select('id')
      .single();
    if (error) {
      logError({ message: 'cron_runs insert failed', domain: 'cron', meta: { job_name: jobName }, error });
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    logError({ message: 'startCronRun failed', domain: 'cron', meta: { job_name: jobName }, error: e });
    return null;
  }
}

/** Set finished_at and status (success or failure); optional error_summary. */
export async function finishCronRun(
  runId: string | null,
  status: 'success' | 'failure',
  errorSummary?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!runId) return;
  try {
    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {
      finished_at: new Date().toISOString(),
      status,
      ...(errorSummary != null && { error_summary: errorSummary }),
      ...(metadata && { metadata }),
    };
    const { error } = await supabase.from('cron_runs').update(updates).eq('id', runId);
    if (error) {
      logError({ message: 'cron_runs update failed', domain: 'cron', meta: { run_id: runId, status }, error });
    }
  } catch (e) {
    logError({ message: 'finishCronRun failed', domain: 'cron', meta: { run_id: runId }, error: e });
  }
}

/** Run a cron handler with tracking: start run, execute fn, then finish with success/failure. */
export async function withCronTracking<T>(
  jobName: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const runId = await startCronRun(jobName, meta);
  try {
    const result = await fn();
    await finishCronRun(runId, 'success');
    return result;
  } catch (err) {
    const summary = err instanceof Error ? err.message : String(err);
    await finishCronRun(runId, 'failure', summary);
    throw err;
  }
}
