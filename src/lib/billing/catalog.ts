/**
 * Single source of truth for purchasable modules/add-ons.
 * Maps module keys to feature/addon codes, Stripe price IDs, and display metadata.
 */
import 'server-only';

/** Purchasable module keys (URL-safe, used in /app/upgrade?module=...) */
export const MODULE_KEYS = [
  'helphubqr',
  'lidar_starter',
  'lidar_unlimited',
  'ai_command_center',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

/** DB addon_code (org_addons.addon_code) and feature_code (get_effective_entitlements) */
export const MODULE_TO_ADDON: Record<ModuleKey, string> = {
  helphubqr: 'helphub_qr',
  lidar_starter: 'lidar',
  lidar_unlimited: 'lidar',
  ai_command_center: 'ai_command_center',
};

/** Feature code used in get_effective_entitlements / org_has_feature */
export function getFeatureCodeForModule(moduleKey: ModuleKey): string {
  return MODULE_TO_ADDON[moduleKey];
}

/** Icon name for paywall (maps to lucide-react on client). */
export type ModuleIconName = 'QrCode' | 'Scan' | 'Cpu' | 'Zap';

export interface ModuleCatalogEntry {
  key: ModuleKey;
  name: string;
  description: string;
  /** "What you get" bullets for paywall. */
  descriptionBullets: string[];
  priceCents: number;
  priceDisplay: string;
  primaryCtaLabel: string;
  icon: ModuleIconName;
  stripePriceIdEnvKey: string;
}

function envPriceId(envKey: string): string | null {
  const v = process.env[envKey];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function getStripePriceIdForModule(moduleKey: ModuleKey): string | null {
  const entry = MODULE_CATALOG[moduleKey];
  return entry ? envPriceId(entry.stripePriceIdEnvKey) : null;
}

/** Default prices (cents) when env not set; catalog display only. */
const DEFAULT_MODULE_PRICES_CENTS: Record<ModuleKey, number> = {
  helphubqr: 2900,
  lidar_starter: 7900,
  lidar_unlimited: 19900,
  ai_command_center: 4900,
};

function envInt(key: string, defaultVal: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultVal;
}

export const MODULE_CATALOG: Record<ModuleKey, ModuleCatalogEntry> = {
  helphubqr: {
    key: 'helphubqr',
    name: 'HelpHubQR',
    description: 'QR issue reporting → ops tasks. Customer ticketing and proof-of-response logs.',
    descriptionBullets: [
      'QR codes and unique links per location',
      'Customer submissions become ops tasks',
      'Proof-of-response and audit logs',
      'Real-time alerts and tracking',
    ],
    priceCents: envInt('MODULE_HELPHUBQR_PRICE_CENTS', DEFAULT_MODULE_PRICES_CENTS.helphubqr),
    priceDisplay: '$29',
    primaryCtaLabel: 'Add to plan',
    icon: 'QrCode',
    stripePriceIdEnvKey: 'STRIPE_PRICE_HELPHUBQR_ID',
  },
  lidar_starter: {
    key: 'lidar_starter',
    name: 'LiDAR Starter',
    description: 'LiDAR facility mapping with limited scans per month.',
    descriptionBullets: [
      'LiDAR scans with square footage',
      'Room mapping and zones',
      'Limited scans per month',
      'Scope builder integration',
    ],
    priceCents: envInt('MODULE_LIDAR_STARTER_PRICE_CENTS', DEFAULT_MODULE_PRICES_CENTS.lidar_starter),
    priceDisplay: '$79',
    primaryCtaLabel: 'Add to plan',
    icon: 'Scan',
    stripePriceIdEnvKey: 'STRIPE_PRICE_LIDAR_STARTER_ID',
  },
  lidar_unlimited: {
    key: 'lidar_unlimited',
    name: 'LiDAR Unlimited',
    description: 'Unlimited LiDAR scans, room mapping, and scope builder integration.',
    descriptionBullets: [
      'Unlimited LiDAR scans',
      'Automatic square footage',
      'Room mapping and surface detection',
      'Full scope builder integration',
    ],
    priceCents: envInt('MODULE_LIDAR_UNLIMITED_PRICE_CENTS', DEFAULT_MODULE_PRICES_CENTS.lidar_unlimited),
    priceDisplay: '$199',
    primaryCtaLabel: 'Add to plan',
    icon: 'Scan',
    stripePriceIdEnvKey: 'STRIPE_PRICE_LIDAR_UNLIMITED_ID',
  },
  ai_command_center: {
    key: 'ai_command_center',
    name: 'AI Command Center',
    description: 'AI-powered insights and command center features.',
    descriptionBullets: [
      'AI-powered insights and recommendations',
      'Command center dashboards',
      'Pattern and trend analysis',
    ],
    priceCents: envInt('MODULE_AI_COMMAND_CENTER_PRICE_CENTS', DEFAULT_MODULE_PRICES_CENTS.ai_command_center),
    priceDisplay: '$49',
    primaryCtaLabel: 'Add to plan',
    icon: 'Cpu',
    stripePriceIdEnvKey: 'STRIPE_PRICE_AI_COMMAND_CENTER_ID',
  },
};

export function getModuleEntry(key: ModuleKey): ModuleCatalogEntry {
  return MODULE_CATALOG[key];
}

export function isValidModuleKey(value: string): value is ModuleKey {
  return MODULE_KEYS.includes(value as ModuleKey);
}

/** Addon codes we track from catalog (for webhook sync). */
export const CATALOG_ADDON_CODES = [...new Set(MODULE_KEYS.map((k) => MODULE_TO_ADDON[k]))];

/**
 * Returns addon_codes (for org_addons) that correspond to the given Stripe price IDs.
 * Used by webhook to sync subscription items → org_addons.
 */
export function getAddonCodesForStripePriceIds(priceIds: string[]): string[] {
  const set = new Set<string>();
  const ids = new Set(priceIds);
  for (const key of MODULE_KEYS) {
    const priceId = getStripePriceIdForModule(key);
    if (priceId && ids.has(priceId)) set.add(MODULE_TO_ADDON[key]);
  }
  return [...set];
}
