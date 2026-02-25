-- ============================================
-- SUPPLY MANAGEMENT MIGRATION
-- Vendors, Products, Customer Products, Enhanced POs
-- ============================================

-- ============================================
-- VENDORS TABLE (Preferred Suppliers)
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Default Bill To Address (your company's billing address)
  bill_to_company TEXT,
  bill_to_address TEXT,
  bill_to_city TEXT,
  bill_to_state TEXT,
  bill_to_zip TEXT,
  bill_to_country TEXT DEFAULT 'USA',
  
  -- Default Ship To Address (where supplies should be delivered)
  ship_to_company TEXT,
  ship_to_address TEXT,
  ship_to_city TEXT,
  ship_to_state TEXT,
  ship_to_zip TEXT,
  ship_to_country TEXT DEFAULT 'USA',
  
  -- Vendor settings
  account_number TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  is_preferred BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- PRODUCTS TABLE (Supply Catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  vendor_sku TEXT,
  upc TEXT,
  
  category TEXT,
  unit TEXT DEFAULT 'each',
  unit_price DECIMAL(10, 2),
  case_pack INTEGER DEFAULT 1,
  
  -- Reorder settings
  min_stock_level INTEGER,
  reorder_quantity INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- CUSTOMER PRODUCTS (Products assigned to customers/locations for easy reorder)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Can be linked to a client or a specific location
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Customer-specific settings
  default_quantity INTEGER DEFAULT 1,
  custom_price DECIMAL(10, 2),
  notes TEXT,
  
  -- Override ship-to for this customer
  ship_to_company TEXT,
  ship_to_address TEXT,
  ship_to_city TEXT,
  ship_to_state TEXT,
  ship_to_zip TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique product per customer/location
  CONSTRAINT unique_customer_product UNIQUE (org_id, client_id, location_id, product_id)
);
-- ============================================
-- ENHANCE PURCHASE ORDERS with Bill To / Ship To
-- ============================================
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
-- Bill To Address
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bill_to_company TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bill_to_address TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bill_to_city TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bill_to_state TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bill_to_zip TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bill_to_country TEXT DEFAULT 'USA';
-- Ship To Address
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to_company TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to_address TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to_city TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to_state TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to_zip TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ship_to_country TEXT DEFAULT 'USA';
-- Link to client/location for customer orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
-- Email settings
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sent_to_vendor_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_confirmation TEXT;
-- Enhance PO items with product reference
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vendors_org_id ON vendors(org_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_preferred ON vendors(is_preferred);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_customer_products_org_id ON customer_products(org_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_client_id ON customer_products(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_location_id ON customer_products(location_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_product_id ON customer_products(product_id);
CREATE INDEX IF NOT EXISTS idx_po_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_client_id ON purchase_orders(client_id);
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Vendors RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view vendors in their organization"
  ON vendors FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Managers can manage vendors"
  ON vendors FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'ops')
  ));
-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view products in their organization"
  ON products FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Managers can manage products"
  ON products FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'ops')
  ));
-- Customer Products RLS
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view customer products in their organization"
  ON customer_products FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Managers can manage customer products"
  ON customer_products FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'ops', 'sales')
  ));
-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at 
  BEFORE UPDATE ON vendors 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_customer_products_updated_at ON customer_products;
CREATE TRIGGER update_customer_products_updated_at 
  BEFORE UPDATE ON customer_products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- HELPER FUNCTION: Generate next PO number
-- ============================================
CREATE OR REPLACE FUNCTION generate_po_number(org UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN po_number ~ '^PO-[0-9]+$' 
      THEN SUBSTRING(po_number FROM 4)::INTEGER 
      ELSE 0 
    END
  ), 0) + 1 INTO next_num
  FROM purchase_orders 
  WHERE org_id = org;
  
  RETURN 'PO-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
