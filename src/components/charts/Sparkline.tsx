'use client';

/**
 * Lightweight SVG sparkline. Uses raw values; domain min/max with optional padding.
 * When all values equal, renders a flat line.
 * TODO: Replace with real series from API when wiring live data.
 */
interface SparklineProps {
  data: number[];
  className?: string;
  strokeWidth?: number;
  stroke?: string;
  fillOpacity?: number;
  height?: number;
  width?: number;
  /** Add padding to domain so line doesn't touch edges (e.g. 0.1 = 10%). Ignored when range is 0. */
  domainPaddingRatio?: number;
}

export function Sparkline({
  data,
  className = '',
  strokeWidth = 1.5,
  stroke = 'currentColor',
  fillOpacity = 0.15,
  height = 32,
  width = 80,
  domainPaddingRatio = 0.1,
}: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0;
  const minDisplay = range > 0 ? min - range * domainPaddingRatio : min;
  const maxDisplay = range > 0 ? max + range * domainPaddingRatio : max + 1;
  const rangeDisplay = maxDisplay - minDisplay || 1;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + h - ((v - minDisplay) / rangeDisplay) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${padding + w},${padding + h} L ${padding},${padding + h} Z`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={areaD}
        fill={stroke}
        fillOpacity={fillOpacity}
      />
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
