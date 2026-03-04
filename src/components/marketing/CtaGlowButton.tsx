'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type CtaGlowButtonProps = {
  href: string;
  children: React.ReactNode;
  variant: 'primary' | 'secondary';
  className?: string;
};

/**
 * CTA button with cursor-tracking radial glow. Uses CSS vars --mouse-x, --mouse-y.
 * GPU-friendly; no heavy animations.
 */
export function CtaGlowButton({ href, children, variant, className = '' }: CtaGlowButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${rect.width / 2}px`);
    el.style.setProperty('--mouse-y', `${rect.height / 2}px`);
    setIsPressed(false);
  }, []);

  const isPrimary = variant === 'primary';

  return (
    <div
      ref={wrapperRef}
      className={`group relative min-w-[200px] rounded-xl overflow-hidden transition-[transform_250ms_cubic-bezier(.2,.8,.2,1),border-color_350ms_ease-out,box-shadow_350ms_ease-out] ${
        isPressed ? 'scale-[0.97]' : ''
      } ${
        isPrimary
          ? 'border border-indigo-400/50 hover:border-indigo-400/70 shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)]'
          : 'border border-indigo-400/40 hover:border-indigo-400/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.45)]'
      } ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseOut={() => setIsPressed(false)}
      style={
        {
          ['--mouse-x' as string]: '50%',
          ['--mouse-y' as string]: '50%',
        } as React.CSSProperties
      }
    >
      {/* Base: primary = animated gradient (indigo → purple → indigo), subtle 8s drift */}
      {isPrimary && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl cta-gradient-animate"
          style={{
            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
            backgroundSize: '200% 100%',
          }}
          aria-hidden
        />
      )}
      {/* Cursor-tracking glow layer — expands outward on click (250ms) */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-xl transition-[opacity_350ms_ease-out,transform_250ms_cubic-bezier(.2,.8,.2,1)] group-hover:opacity-100 ${isPressed ? 'scale-125' : 'scale-100'}`}
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99,102,241,0.35), transparent 40%)`,
          opacity: isPrimary ? 0.9 : 0.7,
        }}
        aria-hidden
      />
      <Button
        asChild
        size="lg"
        className={`relative z-10 w-full rounded-xl font-semibold border-0 shadow-none transition-all duration-[350ms] ease-out min-h-[3.25rem] px-10 ${
          isPrimary
            ? 'text-white bg-transparent hover:bg-transparent'
            : 'bg-transparent text-indigo-400 hover:bg-transparent hover:text-indigo-300'
        }`}
      >
        <Link href={href}>{children}</Link>
      </Button>
    </div>
  );
}
