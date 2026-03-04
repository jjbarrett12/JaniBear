-- Allow managers to create/update vendors and products (match can_write_org pattern used elsewhere)
-- Previously only owner, admin, ops could manage; org_members often use role 'manager'

DROP POLICY IF EXISTS "Managers can manage vendors" ON vendors;
CREATE POLICY "Managers can manage vendors"
  ON vendors FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'manager', 'ops')
  ));
DROP POLICY IF EXISTS "Managers can manage products" ON products;
CREATE POLICY "Managers can manage products"
  ON products FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'manager', 'ops')
  ));
