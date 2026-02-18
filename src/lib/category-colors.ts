/**
 * Canonical category → badge style. Use everywhere (sidebar, products list, submitted orders)
 * so the same category always has the same color.
 */
const CATEGORY_STYLES: Record<string, string> = {
  'Foodservice & Disposables':
    'border-amber-500/60 bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50',
  'Janitorial & Cleaning':
    'border-sky-500/60 bg-sky-500/15 text-sky-800 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/50',
  'Cleaning Chemicals':
    'border-emerald-500/60 bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/50',
  'Paper Products':
    'border-amber-500/60 bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50',
  'Trash Liners':
    'border-slate-500/60 bg-slate-500/15 text-slate-800 dark:bg-slate-500/25 dark:text-slate-200 dark:border-slate-400/50',
  'Floor Care':
    'border-sky-500/60 bg-sky-500/15 text-sky-800 dark:bg-sky-500/25 dark:text-sky-200 dark:border-sky-400/50',
  'Restroom Supplies':
    'border-violet-500/60 bg-violet-500/15 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/50',
  Equipment:
    'border-orange-500/60 bg-orange-500/15 text-orange-800 dark:bg-orange-500/25 dark:text-orange-200 dark:border-orange-400/50',
  'Safety Supplies':
    'border-red-500/60 bg-red-500/15 text-red-800 dark:bg-red-500/25 dark:text-red-200 dark:border-red-400/50',
  Microfiber:
    'border-indigo-500/60 bg-indigo-500/15 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-200 dark:border-indigo-400/50',
  Dispensers:
    'border-teal-500/60 bg-teal-500/15 text-teal-800 dark:bg-teal-500/25 dark:text-teal-200 dark:border-teal-400/50',
  Other:
    'border-zinc-400/60 bg-zinc-500/15 text-zinc-700 dark:bg-zinc-500/25 dark:text-zinc-200 dark:border-zinc-400/50',
};

const DEFAULT_STYLE =
  'border-border bg-muted/80 text-muted-foreground';

/**
 * Returns Tailwind classes for a category badge. Same category always gets the same color.
 */
export function getCategoryBadgeClass(category: string | null | undefined): string {
  if (!category?.trim()) return DEFAULT_STYLE;
  const key = category.trim();
  return CATEGORY_STYLES[key] ?? DEFAULT_STYLE;
}
