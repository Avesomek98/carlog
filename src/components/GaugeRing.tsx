import type { ReactNode } from 'react';

type GaugeRingProps = {
  percent: number; // 0-100, ile "zapasu" zostało (100 = pełny zapas, 0 = termin dziś)
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
};

export default function GaugeRing({ percent, color, size = 128, strokeWidth = 10, children }: GaugeRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="gauge-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="gauge-ring-progress"
        />
      </svg>
      <div className="gauge-ring-content">{children}</div>
    </div>
  );
}
