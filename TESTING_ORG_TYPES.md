# Testing All Three Organization Types (Franchisor / Franchisee / Independent)

To see the **Franchisor**, **Franchisee**, and **Independent** experiences with one login, you need to be a member of three organizations (one of each type) and use the **org switcher** in Settings to change which org is active.

## 1. Get your user ID

- In **Supabase Dashboard**: Authentication → Users → click your user → copy the **UUID**.
- Or run in SQL Editor: `SELECT id FROM auth.users WHERE email = 'your@email.com';`

## 2. Create three test orgs and add yourself

Run the following in **Supabase → SQL Editor**. Replace **both** occurrences of `YOUR_USER_ID` with your UUID from step 1 (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

```sql
-- 1) Ensure profile exists (required for org_members)
INSERT INTO profiles (id, full_name)
VALUES ('YOUR_USER_ID', 'Test User')
ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

-- 2) Create three organizations (one per type) if they don't exist
INSERT INTO organizations (id, name, org_type)
SELECT gen_random_uuid(), 'Test Franchisor', 'franchisor'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Franchisor' AND org_type = 'franchisor');
INSERT INTO organizations (id, name, org_type)
SELECT gen_random_uuid(), 'Test Franchisee', 'franchisee'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Franchisee' AND org_type = 'franchisee');
INSERT INTO organizations (id, name, org_type)
SELECT gen_random_uuid(), 'Test Independent', 'independent'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Independent' AND org_type = 'independent');

-- 3) Add yourself to each org and give each a subscription (run with SQL Editor privilege)
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID';
  v_fr_id UUID; v_fe_id UUID; v_in_id UUID;
BEGIN
  SELECT id INTO v_fr_id FROM organizations WHERE name = 'Test Franchisor' AND org_type = 'franchisor' LIMIT 1;
  SELECT id INTO v_fe_id FROM organizations WHERE name = 'Test Franchisee' AND org_type = 'franchisee' LIMIT 1;
  SELECT id INTO v_in_id FROM organizations WHERE name = 'Test Independent' AND org_type = 'independent' LIMIT 1;

  IF v_fr_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_fr_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status) VALUES (v_fr_id, 'fr_tier2', 'active')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
  IF v_fe_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_fe_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status) VALUES (v_fe_id, 'op_tier2', 'active')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
  IF v_in_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_in_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status) VALUES (v_in_id, 'op_tier2', 'active')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
END $$;
```

**Note:** Adding yourself to a second/third org is not allowed by normal RLS (only your first membership is). So this script must be run in the SQL Editor (which uses elevated privilege). After it runs, you’ll be a member of all three test orgs.

## 3. Switch organizations in the app

1. Log in and go to **Settings** (sidebar → Settings).
2. In the **Organization** card, use the **Active organization** dropdown.
3. Choose **Test Franchisor**, **Test Franchisee**, or **Test Independent**.
4. The page will reload; the app (sidebar, dashboard, routes) will now use the selected org type.

## What you’ll see by type

- **Franchisor:** Standards/outcomes focus; no labor control, no worker PII; “Suggested” / “Recommended” language.
- **Franchisee / Independent (operator):** Full operations: crews, schedules, inspections, labor data, etc.

Routes and features are gated by `org_type` and permissions; switching orgs is how you test each experience with a single login.
