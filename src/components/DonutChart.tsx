import type { ReactNode } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export default function DonutChart({
  data,
  size = 148,
  thickness = 22,
  children,
}: {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let gradient: string;
  if (total <= 0) {
    gradient = 'var(--border)';
  } else {
    let acc = 0;
    const stops: string[] = [];
    for (const d of data) {
      if (d.value <= 0) continue;
      const start = (acc / total) * 100;
      acc += d.value;
      const end = (acc / total) * 100;
      stops.push(`${d.color} ${start}% ${end}%`);
    }
    gradient = `conic-gradient(${stops.join(', ')})`;
  }

  return (
    <div className="donut-chart" style={{ width: size, height: size, background: gradient }}>
      <div className="donut-chart-hole" style={{ inset: thickness }}>
        {children}
      </div>
    </div>
  );
}
