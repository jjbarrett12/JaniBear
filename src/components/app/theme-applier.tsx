'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/theme-provider';

export function ThemeApplier() {
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme.primary) {
      // Convert hex to HSL if needed
      const hexToHsl = (hex: string) => {
        // Remove # if present
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
      };

      if (theme.primary.startsWith('#')) {
        root.style.setProperty('--primary', hexToHsl(theme.primary));
      } else if (!theme.primary.includes('%')) {
        // Assume it's already HSL format
        root.style.setProperty('--primary', theme.primary);
      }

      if (theme.secondary.startsWith('#')) {
        root.style.setProperty('--secondary', hexToHsl(theme.secondary));
      } else if (!theme.secondary.includes('%')) {
        root.style.setProperty('--secondary', theme.secondary);
      }
    }
  }, [theme]);

  return null;
}
