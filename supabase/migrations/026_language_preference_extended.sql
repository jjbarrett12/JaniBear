-- Extend language_preference to support major US languages: Portuguese, Italian,
-- Russian, Ukrainian, Chinese, Vietnamese, Tagalog, French, Arabic, Korean.

-- profiles (from 001_initial_schema)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_language_preference_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_language_preference_check
  CHECK (language_preference IN ('en', 'es', 'pt', 'it', 'ru', 'uk', 'zh', 'vi', 'tl', 'fr', 'ar', 'ko'));

-- employees (from 007_ai_admin_features / 010_foundation_update) — only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_language_preference_check;
    ALTER TABLE employees ADD CONSTRAINT employees_language_preference_check
      CHECK (language_preference IN ('en', 'es', 'pt', 'it', 'ru', 'uk', 'zh', 'vi', 'tl', 'fr', 'ar', 'ko'));
  END IF;
END $$;
