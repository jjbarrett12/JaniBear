'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ThemeColors {
  primary: string;
  secondary: string;
  logoUrl?: string | null;
}

const defaultTheme: ThemeColors = {
  primary: '#3b82f6', // Default blue
  secondary: '#64748b', // Default gray
  logoUrl: null,
};

type ThemeContextValue = {
  theme: ThemeColors;
  setTheme: (next: Partial<ThemeColors> | ((prev: ThemeColors) => ThemeColors)) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {},
});

export function ThemeProvider({ children, orgId, initialTheme }: {
  children: React.ReactNode;
  orgId?: string;
  initialTheme?: {
    primary_color?: string | null;
    secondary_color?: string | null;
    logo_url?: string | null;
  } | null;
}) {
  const hasCustomBranding = initialTheme && (
    (initialTheme.primary_color && initialTheme.primary_color.trim()) ||
    (initialTheme.secondary_color && initialTheme.secondary_color.trim()) ||
    initialTheme.logo_url
  );
  const [theme, setThemeState] = useState<ThemeColors>(() => {
    if (hasCustomBranding && initialTheme) {
      const p = (initialTheme.primary_color && initialTheme.primary_color.trim()) || defaultTheme.primary;
      const s = (initialTheme.secondary_color && initialTheme.secondary_color.trim()) || defaultTheme.secondary;
      return {
        primary: p,
        secondary: s,
        logoUrl: initialTheme.logo_url ?? null,
      };
    }
    return defaultTheme;
  });

  const setTheme = useCallback((next: Partial<ThemeColors> | ((prev: ThemeColors) => ThemeColors)) => {
    setThemeState((prev) => {
      if (typeof next === 'function') return next(prev);
      return {
        primary: next.primary ?? prev.primary,
        secondary: next.secondary ?? prev.secondary,
        logoUrl: next.logoUrl !== undefined ? next.logoUrl : prev.logoUrl,
      };
    });
  }, []);

  // Sync from server when layout re-fetches after router.refresh() (e.g. after saving branding)
  useEffect(() => {
    if (!initialTheme) return;
    const p = (initialTheme.primary_color && initialTheme.primary_color.trim()) || defaultTheme.primary;
    const s = (initialTheme.secondary_color && initialTheme.secondary_color.trim()) || defaultTheme.secondary;
    const hasAny = p !== defaultTheme.primary || s !== defaultTheme.secondary || (initialTheme.logo_url ?? null);
    if (!hasAny) return;
    setThemeState({
      primary: p,
      secondary: s,
      logoUrl: initialTheme.logo_url ?? null,
    });
  }, [initialTheme?.primary_color, initialTheme?.secondary_color, initialTheme?.logo_url]);

  useEffect(() => {
    if (!orgId || hasCustomBranding) return;

    const loadTheme = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('organizations')
          .select('primary_color, secondary_color, logo_url')
          .eq('id', orgId)
          .maybeSingle();

        if (data && ((data.primary_color && data.primary_color.trim()) || (data.secondary_color && data.secondary_color.trim()) || data.logo_url)) {
          setThemeState({
            primary: (data.primary_color && data.primary_color.trim()) || defaultTheme.primary,
            secondary: (data.secondary_color && data.secondary_color.trim()) || defaultTheme.secondary,
            logoUrl: data.logo_url ?? null,
          });
        }
      } catch {
        // Ignore: session may not be available on client; server already passed initialTheme when it could.
      }
    };

    loadTheme();
  }, [orgId, hasCustomBranding]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
