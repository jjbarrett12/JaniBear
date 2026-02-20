'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Hero foreground: true transparent image first (True Transparent Hero.png), then fallbacks */
const DEVICES_PATHS = [
  '/True%20Transparent%20Hero.png',
  '/hero-devices-transparent.png',
  '/ChatGPT%20Image%20Feb%2019%2C%202026%2C%2012_40_33%20AM.png',
  '/hero-devices.png',
  '/Laptop%20and%20phone%20display%20.png',
];

export function HeroCenterImage() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = DEVICES_PATHS[idx];

  const handleError = () => {
    if (idx + 1 < DEVICES_PATHS.length) {
      setIdx((i) => i + 1);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div
        className="w-[280px] sm:w-[340px] md:w-[400px] h-[180px] sm:h-[220px] rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-zinc-500 text-sm"
        aria-hidden
      >
        Add hero-devices.png to public/
      </div>
    );
  }

  return (
    <>
      <div className="absolute -inset-6 bg-amber-400/10 rounded-3xl blur-2xl" aria-hidden />
      <div className="relative w-[520px] sm:w-[640px] md:w-[780px] lg:w-[900px] xl:w-[1000px]">
        <Image
          src={src}
          alt="JANIBEAR on laptop and phone"
          width={900}
          height={560}
          className="w-full h-auto object-contain drop-shadow-2xl"
          priority
          unoptimized
          onError={handleError}
        />
      </div>
    </>
  );
}
