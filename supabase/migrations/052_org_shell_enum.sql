-- ============================================
-- ORG SHELL — 3 distinct dashboard experiences (source of truth)
-- owner_operator | franchisee | franchisor
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_shell') THEN
    CREATE TYPE org_shell AS ENUM ('owner_operator', 'franchisee', 'franchisor');
  END IF;
END
$$;

COMMENT ON TYPE org_shell IS 'Dashboard experience: owner_operator (independent), franchisee (unit + network), franchisor (brand HQ only).';

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS shell org_shell NOT NULL DEFAULT 'owner_operator';

COMMENT ON COLUMN organizations.shell IS 'Dashboard experience; only platform admin can change. Drives nav, landing, route access.';

-- Constraint: only enum values (enum already enforces)
-- Backfill from org_type (one-time: only where org_type indicates franchisee/franchisor)
UPDATE organizations
SET shell = CASE
  WHEN org_type = 'franchisor' THEN 'franchisor'::org_shell
  WHEN org_type = 'franchisee' THEN 'franchisee'::org_shell
  ELSE shell
END
WHERE org_type IN ('franchisor', 'franchisee');

CREATE INDEX IF NOT EXISTS idx_organizations_shell ON organizations(shell);
