-- Run in Supabase Dashboard → SQL Editor if you get "Remote migration versions not found".
-- Option A: Fix names so remote rows match local filenames (then run: npx supabase db push).
UPDATE supabase_migrations.schema_migrations SET name = '021_org_update_allow_manager_branding' WHERE version = '021';
UPDATE supabase_migrations.schema_migrations SET name = '022_location_dashboard_fields' WHERE version = '022';
UPDATE supabase_migrations.schema_migrations SET name = '026_language_preference_extended' WHERE version = '026';
UPDATE supabase_migrations.schema_migrations SET name = '027_scope_surface_audit_fields' WHERE version = '027';
UPDATE supabase_migrations.schema_migrations SET name = '035_missed_task_notifications' WHERE version = '035';
-- If your schema_migrations has a "name" column, run the UPDATEs above. If not, use Option B.
-- Option B: Remove those rows so they can be re-applied (then run: npx supabase db push --include-all).
-- DELETE FROM supabase_migrations.schema_migrations WHERE version IN ('021','022','026','027','035');
