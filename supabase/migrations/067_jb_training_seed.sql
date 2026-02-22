-- Seed demo courses for JANIBEAR University (org_id NULL = global/platform courses).
-- Run after 066_jb_training_tables.sql. Safe to run multiple times (inserts only when no global courses exist).

DO $$
DECLARE
  cid UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.jb_training_courses WHERE org_id IS NULL LIMIT 1) THEN
    INSERT INTO public.jb_training_courses (org_id, title, description, category, level, language, is_active, estimated_minutes, content_type, premium_tier)
    VALUES
      (NULL, 'Chemical Dilution & Safety', 'Safe handling, dilution ratios, and SDS basics.', 'chemicals', 'foundation', 'en', true, 25, 'mixed', 'free'),
      (NULL, 'Restroom Sanitation Standards', 'Restroom cleaning procedures and health standards.', 'safety', 'foundation', 'en', true, 20, 'mixed', 'free'),
      (NULL, 'Floor Care Basics', 'Introduction to floor types, cleaning methods, and equipment.', 'floor_care', 'foundation', 'en', true, 30, 'video', 'free'),
      (NULL, 'Customer Service Basics', 'Professional communication and client interaction.', 'customer_service', 'foundation', 'en', true, 15, 'mixed', 'free'),
      (NULL, 'Terminal Cleaning', 'Healthcare and terminal cleaning protocols.', 'medical', 'skill', 'en', true, 45, 'mixed', 'grizzly'),
      (NULL, 'Strip & Wax Deep Dive', 'Advanced strip, seal, and wax procedures.', 'floor_care', 'skill', 'en', true, 60, 'video', 'grizzly');
  END IF;

  FOR cid IN SELECT id FROM public.jb_training_courses WHERE org_id IS NULL
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.jb_training_lessons WHERE course_id = cid LIMIT 1) THEN
      INSERT INTO public.jb_training_lessons (course_id, title, sort_order, content_type, estimated_minutes)
      VALUES (cid, 'Overview', 1, 'video', 5);
    END IF;
  END LOOP;
END;
$$;
