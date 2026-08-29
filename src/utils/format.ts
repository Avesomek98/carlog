import type { Unit } from '../types';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });
}

export function kmToUnit(km: number, unit: Unit): number {
  return unit === 'mi' ? Math.round(km * 0.621371) : Math.round(km);
}

export function unitToKm(value: number, unit: Unit): number {
  return unit === 'mi' ? Math.round(value / 0.621371) : Math.round(value);
}

export function formatDistance(km: number, unit: Unit): string {
  return `${kmToUnit(km, unit).toLocaleString('pl-PL')} ${unit}`;
}

export function formatRemainingDays(days: number | null): string | null {
  if (days == null) return null;
  if (days < 0) return `${Math.abs(days)} dni po terminie`;
  if (days === 0) return 'dziś';
  return `za ${days} dni`;
}

export function formatRemainingKm(km: number | null, unit: Unit): string | null {
  if (km == null) return null;
  const v = kmToUnit(Math.abs(km), unit);
  if (km < 0) return `${v.toLocaleString('pl-PL')} ${unit} po terminie`;
  return `za ${v.toLocaleString('pl-PL')} ${unit}`;
}
