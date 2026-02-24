'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AppLink } from '@/components/app/app-link';

function getInitials(email: string | undefined, fullName: string | null): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0] || '';
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return local[0]?.toUpperCase() || '?';
  }
  return 'Me';
}

export function UserAvatarHeader() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>('Me');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      setInitials(getInitials(user.email ?? undefined, (user.user_metadata?.full_name as string) ?? null));

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile?.full_name) setInitials(getInitials(user.email ?? undefined, profile.full_name));
      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLink
      href="/app/settings"
      className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden text-primary-foreground/90 hover:bg-primary-foreground/15 border border-primary-foreground/20 shrink-0"
      title="Settings"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Your profile"
          width={32}
          height={32}
          className="h-8 w-8 object-cover"
          unoptimized
        />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </AppLink>
  );
}
