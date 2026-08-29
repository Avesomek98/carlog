import { useState } from 'react';
import { db } from '../db';
import type { ServiceTask } from '../types';

const CUSTOM = 'custom';

export default function PlanServiceForm({
  vehicleId,
  tasks,
  onDone,
}: {
  vehicleId: number;
  tasks: ServiceTask[];
  onDone: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(tasks[0]?.id != null ? String(tasks[0].id) : CUSTOM);
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  async function save() {
    const name = selectedId === CUSTOM ? customName.trim() : tasks.find((t) => t.id === Number(selectedId))?.name;
    if (!name || !date) return;

    await db.plannedServices.add({
      vehicleId,
      name,
      serviceTaskId: selectedId === CUSTOM ? undefined : Number(selectedId),
      plannedDate: new Date(date).toISOString(),
      note: note.trim() || undefined,
    });
    onDone();
  }

  return (
    <div className="card">
      <p className="field-label">Zaplanuj serwis</p>
      <div className="form-grid" style={{ marginTop: 10 }}>
        <label className="span-2">
          Co planujesz
          <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value={CUSTOM}>+ Inna czynność...</option>
          </select>
        </label>

        {selectedId === CUSTOM && (
          <label className="span-2">
            Nazwa czynności
            <input className="input" placeholder="np. Wymiana opon" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </label>
        )}

        <label>
          Data wizyty
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="span-2">
          Notatka
          <input className="input" placeholder="np. warsztat, godzina" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      <div className="row-between">
        <button className="btn btn-small btn-ghost" onClick={onDone}>Anuluj</button>
        <button className="btn btn-small" onClick={save}>Zaplanuj</button>
      </div>
    </div>
  );
}
