-- Extend proposals for 5+ page customizable document
-- Page 1: Cover – title, intro
-- Page 2: Scope of work
-- Page 3: Contract terms
-- Page 4: Pricing (line items + total)
-- Page 5: Acceptance / signature

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proposal_title TEXT,
  ADD COLUMN IF NOT EXISTS cover_intro TEXT,
  ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
  ADD COLUMN IF NOT EXISTS contract_verbiage TEXT,
  ADD COLUMN IF NOT EXISTS pricing_line_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS acceptance_terms TEXT,
  ADD COLUMN IF NOT EXISTS valid_until_date DATE;
-- pricing_line_items: [{ "description": string, "quantity": number, "unit": string, "unit_price": number, "amount": number }, ...]
COMMENT ON COLUMN proposals.pricing_line_items IS 'Array of { description, quantity?, unit?, unit_price?, amount } for customizable pricing table';
