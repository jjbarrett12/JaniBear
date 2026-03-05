/**
 * Canonical link component for dashboard navigation. Re-exports AppLink from app-link
 * so all internal /app/* nav uses client-side Next.js Link (no full reload, no marketing flash).
 * Use with appRoutes from @/lib/routes for hrefs.
 */
export { AppLink } from './app-link';
