'use client';

/**
 * Mini vertical bar sparkline (SVG). For crew utilization, counts, etc.
 * TODO: Wire to real metric series when available.
 */
interface MiniBarSparkProps {
  data: number[];
  className?: string;
  barColor?: string;
  height?: number;
  width?: number;
}

export function MiniBarSpark({
  data,
  className = '',
  barColor = 'currentColor',
  height = 32,
  width = 80,
}: MiniBarSparkProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const scale = max > 0 ? (height - 4) / max : 0;
  const barW = Math.max(2, (width - (data.length - 1) * 2) / data.length - 2);
  const gap = 2;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {data.map((v, i) => {
        const x = i * (barW + gap);
        const barH = v * scale;
        const y = height - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={barColor}
            fillOpacity={0.7}
          />
        );
      })}
    </svg>
  );
}
