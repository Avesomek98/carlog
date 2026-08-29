import type { HistoryEntry, ServiceTask } from '../types';

export interface CostEstimate {
  averageCost: number;
  sampleCount: number;
}

// Szacunek kosztu = średnia z Twoich WŁASNYCH poprzednich wpisów dla tej samej
// czynności. Świadomie nie zgadujemy "typowych cen części/robocizny" - nie mamy
// wiarygodnego źródła aktualnych cen, więc lepiej pokazać "brak danych" niż zmyślać.
export function estimateTaskCost(task: ServiceTask, entries: HistoryEntry[]): CostEstimate | null {
  const relevant = entries.filter((e) => e.serviceTaskId === task.id || e.description === task.name);
  if (relevant.length === 0) return null;
  const total = relevant.reduce((sum, e) => sum + e.cost, 0);
  return { averageCost: total / relevant.length, sampleCount: relevant.length };
}
