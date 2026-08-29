import type { ReactNode } from 'react';

export default function StatTile({
  icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'ok' | 'soon' | 'overdue';
}) {
  return (
    <div className={`stat-tile stat-tile-${tone}`}>
      <div className="stat-tile-icon">{icon}</div>
      <div>
        <p className="stat-tile-label">{label}</p>
        <p className="stat-tile-value">{value}</p>
        {sub && <p className="stat-tile-sub">{sub}</p>}
      </div>
    </div>
  );
}
