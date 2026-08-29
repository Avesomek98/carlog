import { db } from '../db';
import type { HistoryEntry } from '../types';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportAllData(): Promise<Blob> {
  const [vehicles, serviceTasks, historyEntries, legalDeadlines, budgetPlans, plannedServices] = await Promise.all([
    db.vehicles.toArray(),
    db.serviceTasks.toArray(),
    db.historyEntries.toArray(),
    db.legalDeadlines.toArray(),
    db.budgetPlans.toArray(),
    db.plannedServices.toArray(),
  ]);

  const historyEntriesSerialized = await Promise.all(
    historyEntries.map(async (entry) => ({
      ...entry,
      photo: entry.photo ? await blobToBase64(entry.photo) : undefined,
    })),
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    vehicles,
    serviceTasks,
    historyEntries: historyEntriesSerialized,
    legalDeadlines,
    budgetPlans,
    plannedServices,
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function importAllData(file: File): Promise<void> {
  const text = await file.text();
  const payload = JSON.parse(text);

  const historyEntries: HistoryEntry[] = await Promise.all(
    (payload.historyEntries ?? []).map(async (entry: HistoryEntry & { photo?: string }) => ({
      ...entry,
      photo: entry.photo ? await base64ToBlob(entry.photo) : undefined,
    })),
  );

  await db.transaction('rw', [db.vehicles, db.serviceTasks, db.historyEntries, db.legalDeadlines, db.budgetPlans, db.plannedServices], async () => {
    await Promise.all([
      db.vehicles.clear(),
      db.serviceTasks.clear(),
      db.historyEntries.clear(),
      db.legalDeadlines.clear(),
      db.budgetPlans.clear(),
      db.plannedServices.clear(),
    ]);
    await db.vehicles.bulkAdd(payload.vehicles ?? []);
    await db.serviceTasks.bulkAdd(payload.serviceTasks ?? []);
    await db.historyEntries.bulkAdd(historyEntries);
    await db.legalDeadlines.bulkAdd(payload.legalDeadlines ?? []);
    await db.budgetPlans.bulkAdd(payload.budgetPlans ?? []);
    await db.plannedServices.bulkAdd(payload.plannedServices ?? []);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
