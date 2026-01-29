-- Migration: AI Capabilities, Admin Features, Compliance, SDS, PO Management, Invoicing, Phone Attendant
-- This migration adds comprehensive admin and AI-powered features

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hire_date DATE,
  termination_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'supervisor', 'manager', 'admin')),
  department TEXT,
  position TEXT,
  hourly_rate DECIMAL(10, 2),
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
  photo_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('safety', 'health', 'environmental', 'training', 'certification', 'inspection', 'audit')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'compliant', 'non_compliant', 'expired')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  completion_date DATE,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  documents JSONB, -- Array of document URLs
  notes TEXT,
  ai_suggestions JSONB, -- AI-generated recommendations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SDS (SAFETY DATA SHEETS) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sds_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  product_code TEXT,
  cas_number TEXT, -- Chemical Abstracts Service number
  version TEXT,
  issue_date DATE,
  expiration_date DATE,
  document_url TEXT NOT NULL, -- URL to stored PDF
  document_storage_path TEXT, -- Storage path in Supabase
  hazard_classifications TEXT[],
  precautionary_statements TEXT[],
  storage_requirements TEXT,
  disposal_requirements TEXT,
  emergency_procedures TEXT,
  ai_summary TEXT, -- AI-generated summary of SDS
  ai_key_hazards TEXT[], -- AI-extracted key hazards
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PURCHASE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_phone TEXT,
  supplier_address TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'in_transit', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  ai_recommendations JSONB, -- AI suggestions for suppliers, products, pricing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PURCHASE ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'each',
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  product_code TEXT,
  supplier_sku TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- For B2B invoicing
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded')),
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_date DATE,
  payment_reference TEXT,
  stripe_invoice_id TEXT, -- For Stripe integration
  stripe_payment_intent_id TEXT,
  notes TEXT,
  terms TEXT,
  ai_generated_notes TEXT, -- AI-generated invoice notes
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  service_date_start DATE,
  service_date_end DATE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHONE ATTENDANT CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phone_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_sid TEXT, -- Twilio or other service call ID
  phone_number TEXT NOT NULL,
  caller_name TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'answered', 'voicemail', 'missed', 'completed', 'failed')),
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT, -- AI-generated transcript
  ai_summary TEXT, -- AI summary of call
  ai_sentiment TEXT, -- AI sentiment analysis
  ai_action_items TEXT[], -- AI-extracted action items
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  related_entity_type TEXT, -- 'location', 'issue', 'inspection', etc.
  related_entity_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- AI CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('compliance', 'sds', 'po', 'invoicing', 'phone', 'general')),
  enabled BOOLEAN DEFAULT true,
  provider TEXT DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic', 'custom')),
  model TEXT DEFAULT 'gpt-4',
  api_key_encrypted TEXT, -- Encrypted API key
  settings JSONB, -- Feature-specific settings
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, feature)
);

-- ============================================
-- PHONE ATTENDANT SUBSCRIPTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phone_attendant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  plan_type TEXT CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
  monthly_rate DECIMAL(10, 2),
  included_minutes INTEGER DEFAULT 0,
  used_minutes INTEGER DEFAULT 0,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  phone_number TEXT, -- Dedicated phone number
  twilio_account_sid TEXT,
  features JSONB, -- Enabled features (voicemail, transcription, AI summary, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_org_id ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);

CREATE INDEX IF NOT EXISTS idx_compliance_org_id ON compliance_records(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_location_id ON compliance_records(location_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_compliance_due_date ON compliance_records(due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_records(type);

CREATE INDEX IF NOT EXISTS idx_sds_org_id ON sds_sheets(org_id);
CREATE INDEX IF NOT EXISTS idx_sds_product_name ON sds_sheets(product_name);
CREATE INDEX IF NOT EXISTS idx_sds_is_active ON sds_sheets(is_active);

CREATE INDEX IF NOT EXISTS idx_po_org_id ON purchase_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_order_date ON purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_phone_calls_org_id ON phone_calls(org_id);
CREATE INDEX IF NOT EXISTS idx_phone_calls_status ON phone_calls(status);
CREATE INDEX IF NOT EXISTS idx_phone_calls_created_at ON phone_calls(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_config_org_id ON ai_config(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_feature ON ai_config(feature);

CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_org_id ON phone_attendant_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_is_active ON phone_attendant_subscriptions(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view employees in their organization"
  ON employees FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Managers can manage employees in their organization"
  ON employees FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'admin')
    )
  );

-- Compliance Records
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view compliance records in their organization"
  ON compliance_records FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage compliance records in their organization"
  ON compliance_records FOR ALL
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- SDS Sheets
ALTER TABLE sds_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view SDS sheets in their organization"
  ON sds_sheets FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage SDS sheets in their organization"
  ON sds_sheets FOR ALL
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Purchase Orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view purchase orders in their organization"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_members WHERE user_id = auth.uid()));

CREATE POLICY "Managers can manage purchase orders in their organization"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'admin')
    )
  );

-- Purchase Order Items
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view PO items for their organization's POs"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (
    po_id IN (
      SELECT id FROM purchase_orders 
      WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Managers can manage PO items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (
    po_id IN (
      SELECT id FROM purchase_orders 
      WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'admin')
      )
    )
  );

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Managers can manage invoices in their organization"
  ON invoices FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'admin')
    )
  );

-- Invoice Items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invoice items for their organization's invoices"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Managers can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'admin')
      )
    )
  );

-- Phone Calls
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view phone calls in their organization"
  ON phone_calls FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage phone calls in their organization"
  ON phone_calls FOR ALL
  TO authenticated
  USING (org_id IN (SELECT org_members WHERE user_id = auth.uid()));

-- AI Config
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view AI config in their organization"
  ON ai_config FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage AI config in their organization"
  ON ai_config FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Phone Attendant Subscriptions
ALTER TABLE phone_attendant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view phone subscriptions in their organization"
  ON phone_attendant_subscriptions FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage phone subscriptions in their organization"
  ON phone_attendant_subscriptions FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- SDS Sheets Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sds-sheets', 'sds-sheets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for SDS sheets
CREATE POLICY "Users can upload SDS sheets for their organization"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sds-sheets' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read SDS sheets from their organization"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sds-sheets' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete SDS sheets from their organization"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sds-sheets' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'admin')
    )
  );

-- Employee Photos Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload employee photos for their organization"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-photos' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read employee photos from their organization"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-photos' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sds_updated_at BEFORE UPDATE ON sds_sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_config_updated_at BEFORE UPDATE ON ai_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_subscriptions_updated_at BEFORE UPDATE ON phone_attendant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  new_po_number TEXT;
  org_prefix TEXT;
BEGIN
  -- Format: ORG-YYYYMMDD-XXXX (e.g., ABC-20250125-0001)
  SELECT 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD((COALESCE(MAX(CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)), 0) + 1)::TEXT, 4, '0')
  INTO new_po_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  RETURN COALESCE(new_po_number, 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001');
END;
$$ LANGUAGE plpgsql;

-- Generate Invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_invoice_number TEXT;
BEGIN
  -- Format: INV-YYYYMMDD-XXXX
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD((COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1)::TEXT, 4, '0')
  INTO new_invoice_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  RETURN COALESCE(new_invoice_number, 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001');
END;
$$ LANGUAGE plpgsql;
