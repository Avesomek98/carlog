import type { Status } from '../types';
import { STATUS_LABEL } from '../utils/status';
import { Check as IconCheck, Clock as IconClock, AlertTriangle as IconAlert, HelpCircle as IconHelpCircle } from 'lucide-react';

const STATUS_ICON: Record<Status, React.ComponentType<{ size?: number }>> = {
  ok: IconCheck,
  soon: IconClock,
  overdue: IconAlert,
  unknown: IconHelpCircle,
};

export default function StatusBadge({ status }: { status: Status }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={12} />
      {STATUS_LABEL[status]}
    </span>
  );
}
