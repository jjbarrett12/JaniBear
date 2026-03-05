'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Hero background: stadium/arena only (no laptop/devices). Overlay devices are in HeroCenterImage. */
const BACKDROP_PATHS = [
  '/hero-stadium.png',
  '/stadium.png',
  '/stadium%20hero3.png',
  '/stadium-hero3.png',
  '/stadium%20hero%203.png',
  '/stadium%20hero2.png',
  '/Stadium%20Hero%20.png',
];

/** Small dark blur placeholder so something shows immediately while the full image loads. */
const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDAAQRBRIhMQYTQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/AJ3k2s6hZ6vLb213LFEoXaqnAHFZ/wCp6j/zpv8AKpRUs2s7EwJh/9k=';

export function HeroBackdropImage() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = BACKDROP_PATHS[idx];

  const handleError = () => {
    if (idx + 1 < BACKDROP_PATHS.length) {
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
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      onError={handleError}
    />
  );
}
