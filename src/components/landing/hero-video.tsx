'use client';

import { useState } from 'react';

/**
 * Hero video: plays /public/hero-video.mp4 when present.
 * If the file is missing, shows a subtle placeholder so the layout doesn’t break.
 */
export function HeroVideo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
        <span>Add hero-video.mp4 to the public folder</span>
      </div>
    );
  }

  return (
    <>
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero-video.mp4"
        poster="/hero-video-poster.jpg"
        playsInline
        muted
        loop
        autoPlay
        onError={() => setFailed(true)}
        aria-label="Commercial cleaning crews at work in large facilities"
      />
      <div className="absolute inset-0 bg-neutral-900/20 pointer-events-none" aria-hidden />
    </>
  );
}
