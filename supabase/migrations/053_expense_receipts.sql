-- Expense receipts: table for metadata + storage bucket for images (AI tax filing)
-- Path pattern: org_id/receipts/id_filename

CREATE TABLE IF NOT EXISTS expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  amount numeric(12,2),
  receipt_date date,
  category text,
  tax_category text,
  vendor text,
  notes text,
  ai_filed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_org_created
  ON expense_receipts(org_id, created_at DESC);

COMMENT ON TABLE expense_receipts IS 'Receipt images and metadata for expenses; AI can extract and file for taxes.';

ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage expense receipts"
  ON expense_receipts FOR ALL
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Storage bucket for receipt images (private; path: org_id/receipts/...)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can insert expense receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can select expense receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update expense receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete expense receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );
