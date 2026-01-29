'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ThemeColors {
  primary: string;
  secondary: string;
  logoUrl?: string | null;
}

const defaultTheme: ThemeColors = {
  primary: '#3b82f6', // Default blue
  secondary: '#64748b', // Default gray
  logoUrl: null,
};

const ThemeContext = createContext<ThemeColors>(defaultTheme);

export function ThemeProvider({ children, orgId, initialTheme }: { 
  children: React.ReactNode; 
  orgId?: string;
  initialTheme?: {
    primary_color?: string | null;
    secondary_color?: string | null;
    logo_url?: string | null;
    custom_branding?: boolean;
  };
}) {
  const [theme, setTheme] = useState<ThemeColors>(() => {
    if (initialTheme?.custom_branding) {
      return {
        primary: initialTheme.primary_color || defaultTheme.primary,
        secondary: initialTheme.secondary_color || defaultTheme.secondary,
        logoUrl: initialTheme.logo_url,
      };
    }
    return defaultTheme;
  });

  useEffect(() => {
    if (!orgId || initialTheme) return;

    const loadTheme = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('organizations')
        .select('primary_color, secondary_color, logo_url, custom_branding')
        .eq('id', orgId)
        .single();

      if (data?.custom_branding) {
        setTheme({
          primary: data.primary_color || defaultTheme.primary,
          secondary: data.secondary_color || defaultTheme.secondary,
          logoUrl: data.logo_url,
        });
      }
    };

    loadTheme();
  }, [orgId, initialTheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
