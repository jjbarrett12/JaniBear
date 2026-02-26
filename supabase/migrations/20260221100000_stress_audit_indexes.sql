-- Stress audit: composite indexes for hot dashboard/AR queries.
-- invoices: AR snapshot and command-center filter by org_id + status (not paid/cancelled/refunded).
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_due
  ON invoices(org_id, due_date)
  WHERE status NOT IN ('paid', 'cancelled', 'refunded');

-- inspections: command-center and operator dashboard filter by org_id + created_at.
CREATE INDEX IF NOT EXISTS idx_inspections_org_created_at
  ON inspections(org_id, created_at DESC);
