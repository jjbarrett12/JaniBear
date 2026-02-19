'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Hero background: scrubber image in public/ (scrubber.png or "scrubber .png") */
const SCRUBBER_PATHS = ['/scrubber.png', '/scrubber%20.png'];

export function HeroBackdropImage() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = SCRUBBER_PATHS[idx];

  const handleError = () => {
    if (idx + 1 < SCRUBBER_PATHS.length) {
      setIdx((i) => i + 1);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return <div className="absolute inset-0 bg-black" aria-hidden />;
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover object-center scale-105"
      priority
      sizes="100vw"
      unoptimized
      onError={handleError}
    />
  );
}
