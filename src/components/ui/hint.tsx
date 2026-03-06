import { cn } from '@/lib/utils';

interface HintProps {
  children: React.ReactNode;
  className?: string;
  /** Slightly more prominent for key onboarding guidance */
  variant?: 'default' | 'muted';
}

/**
 * Contextual micro-guidance: one sentence, close to the relevant UI.
 * Muted styling so it never competes with primary actions.
 */
export function Hint({ children, className, variant = 'default' }: HintProps) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed',
        variant === 'muted' ? 'text-muted-foreground/90' : 'text-muted-foreground',
        className
      )}
      role="note"
    >
      {children}
    </p>
  );
}
