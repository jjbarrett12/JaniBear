-- Production observability: cron job run tracking for operators.
-- Enables inspection of failed cron jobs, billing flows, LiDAR, AI jobs.

CREATE TABLE IF NOT EXISTS public.cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failure')),
  error_summary text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_job_name ON public.cron_runs (job_name);
CREATE INDEX IF NOT EXISTS idx_cron_runs_started_at ON public.cron_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_runs_status ON public.cron_runs (status) WHERE status = 'failure';

COMMENT ON TABLE public.cron_runs IS 'Tracks cron job executions for production observability (start, end, status, error summary).';
