'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MobileOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function MobileOptimizedInput({ label, error, className, ...props }: MobileOptimizedInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-base font-semibold">
        {label}
      </Label>
      <Input
        {...props}
        className={`h-14 text-base ${className || ''}`}
        // Mobile optimizations
        autoComplete={props.autoComplete || 'off'}
        autoCapitalize={props.type === 'email' ? 'none' : 'sentences'}
        autoCorrect={props.type === 'email' ? 'off' : 'on'}
        inputMode={
          props.type === 'email' ? 'email' :
          props.type === 'tel' ? 'tel' :
          props.type === 'number' ? 'numeric' :
          'text'
        }
      />
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
