'use client';

import Image from 'next/image';
import { useState } from 'react';
import { HeroMacbookDashboard } from '@/components/landing/hero-macbook-dashboard';

/**
 * Tries /hero-devices.png, then /hero-devices.jpg; falls back to MacBook dashboard mock if both 404.
 */
export function HeroCenterImage() {
  const [src, setSrc] = useState<string | null>('/hero-devices.png');
  const [triedJpg, setTriedJpg] = useState(false);

  const handleError = () => {
    if (!triedJpg && src === '/hero-devices.png') {
      setTriedJpg(true);
      setSrc('/hero-devices.jpg');
    } else {
      setSrc(null);
    }
  };

  if (src === null) {
    return <HeroMacbookDashboard />;
  }

  return (
    <>
      <div className="absolute -inset-4 bg-amber-400/10 rounded-3xl blur-2xl" aria-hidden />
      {/* Semi-transparent so scrubber background shows through */}
      <div className="relative w-[280px] sm:w-[340px] md:w-[400px] opacity-[0.88]">
        <Image
          src={src}
          alt="JANIBEAR on laptop and phone"
          width={800}
          height={500}
          className="w-full h-auto object-contain drop-shadow-2xl"
          priority
          unoptimized
          onError={handleError}
        />
      </div>
    </>
  );
}
