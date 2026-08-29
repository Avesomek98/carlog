import { useMemo } from 'react';
import { getServiceTaskStatus } from '../utils/status';
import { estimateTaskCost, type CostEstimate } from '../utils/costEstimate';
import type { HistoryEntry, ServiceTask, Status } from '../types';

export interface UpcomingCostItem {
  task: ServiceTask;
  status: Status;
  estimate: CostEstimate | null;
}

export function useUpcomingEstimate(tasks: ServiceTask[], entries: HistoryEntry[], vehicleMileage: number) {
  return useMemo(() => {
    const upcoming: UpcomingCostItem[] = tasks
      .map((t) => ({ task: t, status: getServiceTaskStatus(t, vehicleMileage).status, estimate: estimateTaskCost(t, entries) }))
      .filter((u) => u.status === 'soon' || u.status === 'overdue');
    const known = upcoming.filter((u) => u.estimate != null);
    const total = known.reduce((sum, u) => sum + (u.estimate?.averageCost ?? 0), 0);
    return { upcoming, total, unknownCount: upcoming.length - known.length };
  }, [tasks, entries, vehicleMileage]);
}
