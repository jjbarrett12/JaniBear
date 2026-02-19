'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Hero foreground: laptop + phone image in public/ (hero-devices.png or "Laptop and phone display .png") */
const DEVICES_PATHS = ['/hero-devices.png', '/Laptop%20and%20phone%20display%20.png'];

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
      {/* Larger centerpiece; mix-blend-multiply makes black background show scrubber through */}
      <div className="relative w-[360px] sm:w-[440px] md:w-[520px] lg:w-[580px]">
        <Image
          src={src}
          alt="JANIBEAR on laptop and phone"
          width={900}
          height={560}
          className="w-full h-auto object-contain drop-shadow-2xl mix-blend-multiply"
          priority
          unoptimized
          onError={handleError}
        />
      </div>
    </>
  );
}
