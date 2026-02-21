-- PROFILES: is_platform_admin only writable by platform admin (prevents self-assign)
CREATE OR REPLACE FUNCTION profiles_deny_platform_admin_self_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.is_platform_admin = true AND (OLD.is_platform_admin IS DISTINCT FROM true)) THEN
    IF NOT is_platform_admin() THEN
      RAISE EXCEPTION 'Only a platform admin can set is_platform_admin.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_platform_admin_guard ON profiles;
CREATE TRIGGER profiles_platform_admin_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_deny_platform_admin_self_update();
