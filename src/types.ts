export type Unit = 'km' | 'mi';

export const DRIVETRAINS = ['FWD', 'RWD', 'AWD'] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

export const FUEL_TYPES = ['Benzyna', 'Diesel', 'Hybryda', 'Elektryczny', 'LPG', 'Inny'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export interface Vehicle {
  id?: number;
  make: string;
  model: string;
  year: number;
  vin?: string;
  doors?: number;
  drivetrain?: Drivetrain;
  fuelType?: FuelType;
  engineCapacity?: number; // pojemność silnika w cm3
  mileage: number; // aktualny przebieg, zawsze przechowywany w km
  mileageUpdatedAt: string; // ISO date
  unit: Unit;
  notificationsEnabled: boolean;
}

export interface ServiceTask {
  id?: number;
  vehicleId: number;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
  lastDoneDate?: string; // ISO date
  lastDoneMileage?: number;
  reminderKmBefore: number;
  reminderDaysBefore: number;
  isCustom: boolean;
}

export const HISTORY_TYPES = ['Przegląd', 'Naprawa', 'Część', 'Inne'] as const;
export type HistoryType = (typeof HISTORY_TYPES)[number];

export const BUDGET_CATEGORIES = [
  'Oleje/filtry',
  'Hamulce',
  'Zawieszenie',
  'Elektronika',
  'Opony',
  'Inne',
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export interface HistoryEntry {
  id?: number;
  vehicleId: number;
  date: string; // ISO date
  mileage: number;
  type: HistoryType;
  category: BudgetCategory;
  description: string;
  cost: number;
  workshop?: string;
  serviceTaskId?: number;
  photo?: Blob;
}

export const LEGAL_DEADLINE_TYPES = ['OC/AC', 'Przegląd techniczny', 'Inne'] as const;
export type LegalDeadlineType = (typeof LEGAL_DEADLINE_TYPES)[number];

export interface LegalDeadline {
  id?: number;
  vehicleId: number;
  type: LegalDeadlineType;
  name?: string; // dla typu "Inne"
  validUntil: string; // ISO date
  policyNumber?: string;
  note?: string;
  reminderDaysBefore: number;
}

export interface BudgetPlan {
  id?: number;
  vehicleId: number;
  year: number;
  annualAmount: number;
}

export interface PlannedService {
  id?: number;
  vehicleId: number;
  name: string;
  serviceTaskId?: number; // opcjonalne powiązanie z pozycją harmonogramu
  plannedDate: string; // ISO date
  note?: string;
}

export type Status = 'unknown' | 'ok' | 'soon' | 'overdue';

export interface StatusResult {
  status: Status;
  remainingKm: number | null;
  remainingDays: number | null;
  dueDate: string | null;
}
