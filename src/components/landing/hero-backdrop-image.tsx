'use client';

import Image from 'next/image';
import { useState } from 'react';

const UNSPLASH_BACKDROP = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80';

/** Tries /scrubber.png, then /scrubber.jpg; falls back to Unsplash if both 404. */
export function HeroBackdropImage() {
  const [src, setSrc] = useState('/scrubber.png');
  const [triedJpg, setTriedJpg] = useState(false);

  const handleError = () => {
    if (!triedJpg && src === '/scrubber.png') {
      setTriedJpg(true);
      setSrc('/scrubber.jpg');
    } else {
      setSrc(UNSPLASH_BACKDROP);
    }
  };

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover object-center scale-105"
      priority
      sizes="100vw"
      unoptimized={src.startsWith('http')}
      onError={handleError}
    />
  );
}
