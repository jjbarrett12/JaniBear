-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create organizations if missing
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create profiles if missing (required by app and org_members)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create org_members if missing
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'sales', 'ops', 'inspector', 'cleaner', 'client', 'client_viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- Enable RLS on these tables (no-op if already enabled)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
-- Policies for onboarding: users can create profile and add themselves as first org member
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can add own first membership" ON org_members;
CREATE POLICY "Users can add own first membership"
  ON org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM org_members om WHERE om.user_id = auth.uid())
  );
-- Minimal read/write so app can use these tables (adjust if you have other RLS policies)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Allow insert for new org') THEN
    CREATE POLICY "Allow insert for new org" ON organizations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Org members can read org') THEN
    CREATE POLICY "Org members can read org" ON organizations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'org_members' AND policyname = 'Users can read own memberships') THEN
    CREATE POLICY "Users can read own memberships" ON org_members FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
