/**
 * Single source of truth for all site footer links.
 * Use for Footer.tsx and for link validation (scripts/check-footer-links.mjs).
 * Internal routes use path only; external use full URL.
 */
import { LOGIN_URL } from '@/lib/auth-urls';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

/** Product column: demo, pricing, platform anchors, contact, sign in */
export const FOOTER_PRODUCT: FooterColumn = {
  heading: 'Product',
  links: [
    { label: 'Get a Private Demo', href: '/demo' },
    { label: 'See Plans', href: '/pricing' },
    { label: 'Platform', href: '/#sales-infrastructure' },
    { label: 'Why JANIBEAR', href: '/why-janibear' },
    { label: "Who It's For", href: '/#who-its-for' },
    { label: 'Contact', href: '/contact' },
    { label: 'Sign In', href: LOGIN_URL },
  ],
};

/** Company column */
export const FOOTER_COMPANY: FooterColumn = {
  heading: 'Company',
  links: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Support', href: '/contact' },
  ],
};

/** Legal column */
export const FOOTER_LEGAL: FooterColumn = {
  heading: 'Legal',
  links: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  FOOTER_PRODUCT,
  FOOTER_COMPANY,
  FOOTER_LEGAL,
];

/** All internal paths (no hash, no host) for validation */
export function getFooterInternalPaths(): string[] {
  const paths = new Set<string>();
  for (const col of FOOTER_COLUMNS) {
    for (const link of col.links) {
      if (link.external) continue;
      const path = link.href.replace(/#.*$/, '').replace(/\?.*$/, '') || '/';
      paths.add(path);
    }
  }
  return Array.from(paths);
}
