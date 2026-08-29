import { useState } from 'react';
import { db } from '../db';
import type { ServiceTask } from '../types';

const CUSTOM = 'custom';

export default function AddServiceForm({
  vehicleId,
  tasks,
  vehicleMileage,
  onDone,
}: {
  vehicleId: number;
  tasks: ServiceTask[];
  vehicleMileage: number;
  onDone: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(tasks[0]?.id != null ? String(tasks[0].id) : CUSTOM);
  const [customName, setCustomName] = useState('');
  const [customIntervalKm, setCustomIntervalKm] = useState('');
  const [customIntervalMonths, setCustomIntervalMonths] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState(String(vehicleMileage));
  const [cost, setCost] = useState('');
  const [workshop, setWorkshop] = useState('');

  async function save() {
    const mileageNum = Number(mileage);
    if (!Number.isFinite(mileageNum)) return;
    const dateIso = new Date(date).toISOString();

    let taskId: number;
    let taskName: string;

    if (selectedId === CUSTOM) {
      if (!customName.trim()) return;
      taskId = (await db.serviceTasks.add({
        vehicleId,
        name: customName.trim(),
        intervalKm: customIntervalKm ? Number(customIntervalKm) : undefined,
        intervalMonths: customIntervalMonths ? Number(customIntervalMonths) : undefined,
        reminderKmBefore: 1000,
        reminderDaysBefore: 30,
        isCustom: true,
      })) as number;
      taskName = customName.trim();
    } else {
      taskId = Number(selectedId);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      taskName = task.name;
    }

    await db.serviceTasks.update(taskId, { lastDoneDate: dateIso, lastDoneMileage: mileageNum });
    await db.historyEntries.add({
      vehicleId,
      date: dateIso,
      mileage: mileageNum,
      type: 'Przegląd',
      category: 'Inne',
      description: taskName,
      cost: Number(cost) || 0,
      workshop: workshop || undefined,
      serviceTaskId: taskId,
    });
    onDone();
  }

  return (
    <div className="card">
      <p className="field-label">Dodaj serwis</p>
      <div className="form-grid" style={{ marginTop: 10 }}>
        <label className="span-2">
          Co zrobiono
          <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value={CUSTOM}>+ Inna czynność...</option>
          </select>
        </label>

        {selectedId === CUSTOM && (
          <>
            <label className="span-2">
              Nazwa czynności
              <input className="input" placeholder="np. Wymiana opon" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            </label>
            <label>
              Interwał (km)
              <input className="input" type="number" placeholder="opcjonalnie" value={customIntervalKm} onChange={(e) => setCustomIntervalKm(e.target.value)} />
            </label>
            <label>
              Interwał (miesiące)
              <input className="input" type="number" placeholder="opcjonalnie" value={customIntervalMonths} onChange={(e) => setCustomIntervalMonths(e.target.value)} />
            </label>
          </>
        )}

        <label>
          Data
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Przebieg (km)
          <input className="input" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
        </label>
        <label>
          Koszt (PLN)
          <input className="input" type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
        <label>
          Warsztat
          <input className="input" placeholder="opcjonalnie" value={workshop} onChange={(e) => setWorkshop(e.target.value)} />
        </label>
      </div>
      <div className="row-between">
        <button className="btn btn-small btn-ghost" onClick={onDone}>Anuluj</button>
        <button className="btn btn-small" onClick={save}>Zapisz</button>
      </div>
    </div>
  );
}
