'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GlowPosition = 'left' | 'right' | 'none';

interface SectionWrapProps {
  children: ReactNode;
  glow?: GlowPosition;
  topSeparator?: boolean;
  className?: string;
  id?: string;
  as?: 'section' | 'div';
  'aria-labelledby'?: string;
}

export function SectionWrap({
  children,
  glow = 'none',
  topSeparator = false,
  className,
  id,
  as: Tag = 'section',
  'aria-labelledby': ariaLabelledby,
}: SectionWrapProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cn('relative overflow-hidden', className)}
    >
      {topSeparator && (
        <div
          className="absolute left-0 right-0 top-0 h-12 z-0 bg-gradient-to-b from-white/[0.04] to-transparent"
          aria-hidden
        />
      )}
      {glow !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-60"
          aria-hidden
          style={{
            background:
              glow === 'left'
                ? 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(30,41,59,0.2) 0%, transparent 55%)'
                : 'radial-gradient(ellipse 80% 60% at 90% 50%, rgba(30,41,59,0.2) 0%, transparent 55%)',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </Tag>
  );
}
