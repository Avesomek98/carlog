import type { ServiceTask, LegalDeadline, Status, StatusResult } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY_MS);
}

export function getServiceTaskStatus(
  task: ServiceTask,
  currentMileage: number,
  today: string = new Date().toISOString(),
): StatusResult {
  const hasKmRule = task.intervalKm != null && task.lastDoneMileage != null;
  const hasDateRule = task.intervalMonths != null && !!task.lastDoneDate;

  if (!hasKmRule && !hasDateRule) {
    return { status: 'unknown', remainingKm: null, remainingDays: null, dueDate: null };
  }

  const dueKm = hasKmRule ? task.lastDoneMileage! + task.intervalKm! : null;
  const dueDate = hasDateRule ? addMonths(task.lastDoneDate!, task.intervalMonths!) : null;

  const remainingKm = dueKm != null ? dueKm - currentMileage : null;
  const remainingDays = dueDate != null ? daysBetween(today, dueDate) : null;

  const overdue =
    (remainingKm != null && remainingKm <= 0) || (remainingDays != null && remainingDays <= 0);
  const soon =
    !overdue &&
    ((remainingKm != null && remainingKm <= task.reminderKmBefore) ||
      (remainingDays != null && remainingDays <= task.reminderDaysBefore));

  const status: Status = overdue ? 'overdue' : soon ? 'soon' : 'ok';

  return { status, remainingKm, remainingDays, dueDate };
}

export function getLegalDeadlineStatus(deadline: LegalDeadline, today: string = new Date().toISOString()): StatusResult {
  const remainingDays = daysBetween(today, deadline.validUntil);
  const status: Status = remainingDays <= 0 ? 'overdue' : remainingDays <= deadline.reminderDaysBefore ? 'soon' : 'ok';
  return { status, remainingKm: null, remainingDays, dueDate: deadline.validUntil };
}

export const STATUS_LABEL: Record<Status, string> = {
  unknown: 'Brak danych',
  ok: 'OK',
  soon: 'Zbliża się',
  overdue: 'Przeterminowane',
};

export const STATUS_ORDER: Record<Status, number> = {
  overdue: 0,
  soon: 1,
  unknown: 2,
  ok: 3,
};
