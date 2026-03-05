'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Megaphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISMISS_KEY_PREFIX = 'app-promo-dismissed-';
const TTL_DAYS = 30;

export type AppPromoVariant = 'progear' | 'upgrade' | 'announcement';

type VariantConfig = {
  title: string;
  subtext: string;
  buttonLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const VARIANT_CONFIG: Record<AppPromoVariant, VariantConfig> = {
  progear: {
    title: 'ProGear Shop',
    subtext: 'Gloves, PPE, and janitorial essentials—delivered.',
    buttonLabel: 'Open ProGear',
    href: '/app/pro-gear',
    icon: ShoppingBag,
  },
  upgrade: {
    title: 'Upgrade',
    subtext: 'Add modules and seats in Billing.',
    buttonLabel: 'See plans',
    href: '/app/billing',
    icon: Sparkles,
  },
  announcement: {
    title: 'New',
    subtext: 'Check out what\'s new in your dashboard.',
    buttonLabel: 'Learn more',
    href: '/app/dashboard',
    icon: Megaphone,
  },
};

function getDismissKey(variant: AppPromoVariant): string {
  return `${DISMISS_KEY_PREFIX}${variant}`;
}

function isDismissed(variant: AppPromoVariant): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(getDismissKey(variant));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { until?: number };
    return typeof parsed?.until === 'number' && Date.now() < parsed.until;
  } catch {
    return false;
  }
}

function setDismissed(variant: AppPromoVariant): void {
  try {
    const until = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(getDismissKey(variant), JSON.stringify({ until }));
  } catch {
    // ignore
  }
}

export interface AppPromoSlotProps {
  variant: AppPromoVariant;
  /** When false, hide (e.g. non–billing-manager). When undefined, show to all. */
  allowedByRole?: boolean;
  className?: string;
}

/**
 * Minimal in-app promo slot for sidebar. Dismissible (30-day TTL in localStorage).
 * Use allowedByRole to restrict to billing managers / admins when role is available.
 */
export function AppPromoSlot({
  variant,
  allowedByRole = true,
  className,
}: AppPromoSlotProps) {
  const [dismissed, setDismissedState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissedState(isDismissed(variant));
  }, [variant]);

  if (!allowedByRole || (mounted && dismissed)) return null;

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleHide = (e: React.MouseEvent) => {
    e.preventDefault();
    setDismissed(variant);
    setDismissedState(true);
  };

  return (
    <div
      className={cn(
        'shrink-0 border-t border-border px-3 py-2.5',
        'rounded-lg mx-2 mb-2 bg-muted/40 dark:bg-muted/20',
        className
      )}
      role="complementary"
      aria-label={`Promo: ${config.title}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground leading-tight">
            {config.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {config.subtext}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
              <Link href={config.href}>{config.buttonLabel}</Link>
            </Button>
            <button
              type="button"
              onClick={handleHide}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Hide"
            >
              Hide
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleHide}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
