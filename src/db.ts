import Dexie, { type EntityTable } from 'dexie';
import type { BudgetPlan, Drivetrain, FuelType, HistoryEntry, LegalDeadline, PlannedService, ServiceTask, Vehicle } from './types';
import { seedDefaultTasksIfEmpty } from './seed';

class CarLogDB extends Dexie {
  vehicles!: EntityTable<Vehicle, 'id'>;
  serviceTasks!: EntityTable<ServiceTask, 'id'>;
  historyEntries!: EntityTable<HistoryEntry, 'id'>;
  legalDeadlines!: EntityTable<LegalDeadline, 'id'>;
  budgetPlans!: EntityTable<BudgetPlan, 'id'>;
  plannedServices!: EntityTable<PlannedService, 'id'>;

  constructor() {
    super('carlog');
    this.version(1).stores({
      vehicles: '++id',
      serviceTasks: '++id, vehicleId',
      historyEntries: '++id, vehicleId, date, category, type',
      legalDeadlines: '++id, vehicleId, validUntil',
      budgetPlans: '++id, vehicleId, year, [vehicleId+year]',
      plannedServices: '++id, vehicleId, plannedDate',
    });
  }
}

export const db = new CarLogDB();

export interface NewVehicleInput {
  make: string;
  model: string;
  year: number;
  vin?: string;
  doors?: number;
  drivetrain?: Drivetrain;
  fuelType?: FuelType;
  engineCapacity?: number;
  mileage: number;
  unit: 'km' | 'mi';
}

export async function addVehicle(input: NewVehicleInput): Promise<number> {
  const id = (await db.vehicles.add({
    ...input,
    mileageUpdatedAt: new Date().toISOString(),
    notificationsEnabled: true,
  })) as number;
  await seedDefaultTasksIfEmpty(id);
  return id;
}

export async function deleteVehicle(id: number): Promise<void> {
  await db.transaction('rw', [db.vehicles, db.serviceTasks, db.historyEntries, db.legalDeadlines, db.budgetPlans, db.plannedServices], async () => {
    await db.serviceTasks.where('vehicleId').equals(id).delete();
    await db.historyEntries.where('vehicleId').equals(id).delete();
    await db.legalDeadlines.where('vehicleId').equals(id).delete();
    await db.budgetPlans.where('vehicleId').equals(id).delete();
    await db.plannedServices.where('vehicleId').equals(id).delete();
    await db.vehicles.delete(id);
  });
}
