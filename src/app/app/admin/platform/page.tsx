import { redirect } from 'next/navigation';

/**
 * Legacy route: Platform Admin lived here. Now use /platform/* (platform owner console).
 */
export default function AppAdminPlatformPage() {
  redirect('/platform/overview');
}
