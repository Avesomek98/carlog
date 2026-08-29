import { db } from './db';
import type { ServiceTask } from './types';

// Typowe interwały serwisowe - punkt startowy, do skorygowania wg książki
// serwisowej konkretnego egzemplarza (rocznik/silnik mają znaczenie, zwłaszcza w V8).
const DEFAULT_TASKS: Array<Omit<ServiceTask, 'id' | 'vehicleId'>> = [
  { name: 'Wymiana oleju silnikowego', intervalKm: 10000, intervalMonths: 12, reminderKmBefore: 1000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Filtr oleju', intervalKm: 10000, intervalMonths: 12, reminderKmBefore: 1000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Filtr powietrza', intervalKm: 20000, intervalMonths: 24, reminderKmBefore: 1500, reminderDaysBefore: 30, isCustom: false },
  { name: 'Filtr kabinowy', intervalKm: 15000, intervalMonths: 12, reminderKmBefore: 1000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Filtr paliwa', intervalKm: 40000, reminderKmBefore: 2000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Klocki hamulcowe - przód', intervalKm: 30000, reminderKmBefore: 2000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Klocki hamulcowe - tył', intervalKm: 30000, reminderKmBefore: 2000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Płyn hamulcowy', intervalMonths: 24, reminderKmBefore: 0, reminderDaysBefore: 30, isCustom: false },
  { name: 'Płyn chłodniczy', intervalMonths: 60, reminderKmBefore: 0, reminderDaysBefore: 45, isCustom: false },
  { name: 'Świece zapłonowe', intervalKm: 60000, reminderKmBefore: 2000, reminderDaysBefore: 30, isCustom: false },
  { name: 'Olej w skrzyni biegów', intervalKm: 80000, intervalMonths: 72, reminderKmBefore: 3000, reminderDaysBefore: 60, isCustom: false },
  { name: 'Pasek/łańcuch rozrządu - kontrola', intervalKm: 100000, intervalMonths: 84, reminderKmBefore: 5000, reminderDaysBefore: 60, isCustom: false },
];

export async function seedDefaultTasksIfEmpty(vehicleId: number) {
  const count = await db.serviceTasks.where('vehicleId').equals(vehicleId).count();
  if (count > 0) return;
  await db.serviceTasks.bulkAdd(
    DEFAULT_TASKS.map((t) => ({ ...t, vehicleId })),
  );
}
