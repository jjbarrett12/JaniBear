-- =============================================================================
-- 095: Legacy roles owner/admin — grant same permission keys as org.owner/org.admin
-- create_org_for_signup and existing data use role 'owner'/'admin'; has_permission
-- joins org_members.role to role_permissions.role. Without this, owner/admin
-- would only have the 3 keys added in 094 (dashboard.sales, dashboard.ops, settings.branding).
-- =============================================================================

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'owner', permission_key FROM public.role_permissions WHERE role = 'org.owner'
ON CONFLICT (role, permission_key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin', permission_key FROM public.role_permissions WHERE role = 'org.admin'
ON CONFLICT (role, permission_key) DO NOTHING;
