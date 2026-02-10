'use client';

/**
 * Renders JANIBEAR with logo-style colors: JANI (white) + BEAR (yellow/amber).
 * Use wherever the brand name appears as text.
 * variant="light" for light backgrounds (e.g. app sidebar in light mode).
 */
export function BrandName({
  className = '',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  const janiClass = variant === 'light' ? 'text-gray-900 dark:text-white' : 'text-white';
  const bearClass = variant === 'light' ? 'text-amber-600 dark:text-amber-400' : 'text-amber-400';
  return (
    <span className={`inline-flex font-semibold tracking-tight ${className}`}>
      <span className={janiClass}>JANI</span>
      <span className={bearClass}>BEAR</span>
    </span>
  );
}
