'use client';

import { useReducedMotion } from 'framer-motion';

/** Lightweight dust particles in top 60% of hero. Disabled when motion reduced or ENABLE_MOTION false. */
const PARTICLE_COUNT = 12;
const ENABLE_MOTION = true;

export function HeroParticles() {
  const reduceMotion = useReducedMotion();
  const enabled = ENABLE_MOTION && !reduceMotion;

  if (!enabled) return null;

  return (
    <div
      className="hero-particles-layer absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
      style={{ clipPath: 'inset(0 0 40% 0)' }}
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <div
          key={i}
          className="hero-particle absolute rounded-full bg-white/20"
          style={{
            width: 3 + (i % 4),
            height: 3 + (i % 4),
            left: `${8 + (i * 7.2) % 84}%`,
            top: `${(i * 11) % 55}%`,
            animationDelay: `${i * 0.7}s`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}
