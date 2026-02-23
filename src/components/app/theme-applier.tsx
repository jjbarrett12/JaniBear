'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/theme-provider';

function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Contrasting text on primary: white or black based on luminance */
function primaryForegroundHsl(primaryHex: string): string {
  const hex = primaryHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5 ? '0 0% 9%' : '0 0% 100%'; // dark text on light primary, white on dark primary
}

export function ThemeApplier() {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;

    if (theme.primary) {
      const primaryHsl = theme.primary.startsWith('#') ? hexToHsl(theme.primary) : theme.primary;
      const secondaryHsl = theme.secondary.startsWith('#') ? hexToHsl(theme.secondary) : theme.secondary;

      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--secondary', secondaryHsl);
      root.style.setProperty('--ring', primaryHsl);
      root.style.setProperty('--accent', secondaryHsl);
      if (theme.primary.startsWith('#')) {
        root.style.setProperty('--primary-foreground', primaryForegroundHsl(theme.primary));
      }
    }
  }, [theme]);

  return null;
}
