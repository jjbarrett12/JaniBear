import { requirePlatformAdmin } from '@/lib/platform-guard';

/**
 * /platform/* — platform owner console only.
 * Only whitelisted platform admins (platform_admins table or profiles.is_platform_admin) can access.
 * Unauthenticated -> /auth/login; authenticated but not platform admin -> /platform/forbidden.
 */
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();
  return <>{children}</>;
}
