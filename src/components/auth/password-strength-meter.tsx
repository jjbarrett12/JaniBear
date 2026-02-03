'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

type StrengthLevel = 'poor' | 'fair' | 'good' | 'great';

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-zinc-200">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'flex-1 rounded-full transition-all duration-300',
              index < strength.level
                ? getStrengthColor(strength.level)
                : 'bg-transparent'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', getStrengthTextColor(strength.level))}>
        Password strength: {strength.label}
      </p>
    </div>
  );
}

function calculateStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: '' };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  // Length scoring
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;

  // Character variety scoring
  if (checks.lowercase) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  // Determine level (0-4 scale)
  let level: number;
  let label: string;

  if (score <= 2) {
    level = 1;
    label = 'Poor';
  } else if (score <= 4) {
    level = 2;
    label = 'Fair';
  } else if (score <= 6) {
    level = 3;
    label = 'Good';
  } else {
    level = 4;
    label = 'Great';
  }

  return { level, label };
}

function getStrengthColor(level: number): string {
  switch (level) {
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-200';
  }
}

function getStrengthTextColor(level: number): string {
  switch (level) {
    case 1:
      return 'text-red-600';
    case 2:
      return 'text-orange-600';
    case 3:
      return 'text-yellow-600';
    case 4:
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}
