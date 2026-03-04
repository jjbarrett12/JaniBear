#!/usr/bin/env node
/**
 * Validates that every internal href in footer-links.ts exists in KNOWN_ROUTES.
 * Run: npm run check:footer
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FOOTER_LINKS_PATH = join(ROOT, 'src/components/site/footer-links.ts');

/** Known valid internal routes (pathname only, no hash or query). */
const KNOWN_ROUTES = new Set([
  '/',
  '/about',
  '/auth/login',
  '/contact',
  '/demo',
  '/pricing',
  '/privacy',
  '/survey',
  '/terms',
  '/app/pro-gear/gloves',
]);

function extractInternalPaths(content) {
  const paths = new Set();
  const hrefRe = /href:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = hrefRe.exec(content)) !== null) {
    const href = m[1];
    if (href.startsWith('/') && !href.startsWith('//')) {
      const pathname = href.replace(/#.*$/, '').replace(/\?.*$/, '') || '/';
      paths.add(pathname);
    }
  }
  return Array.from(paths);
}

function main() {
  const content = readFileSync(FOOTER_LINKS_PATH, 'utf8');
  const usedPaths = extractInternalPaths(content);
  const unknown = usedPaths.filter((p) => !KNOWN_ROUTES.has(p));

  if (unknown.length > 0) {
    console.error('check-footer-links: The following footer href path(s) are not in KNOWN_ROUTES:');
    unknown.forEach((p) => console.error('  -', p));
    console.error('\nAdd them to KNOWN_ROUTES in scripts/check-footer-links.mjs or fix the href in footer-links.ts.');
    process.exit(1);
  }

  console.log('check-footer-links: All footer internal links are in KNOWN_ROUTES.');
}

main();
