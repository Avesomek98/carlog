import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { getLegalDeadlineStatus, STATUS_ORDER } from '../utils/status';
import { formatDate, formatRemainingDays } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import { Plus as IconPlus, Trash2 as IconTrash } from 'lucide-react';
import { LEGAL_DEADLINE_TYPES, type LegalDeadline, type LegalDeadlineType } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyGarage from '../components/EmptyGarage';

export default function Legal() {
  const { vehicleId, loaded } = useActiveVehicle();
  const deadlines = useLiveQuery(() => (vehicleId ? db.legalDeadlines.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? [];
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!loaded) return <Skeleton />;
  if (!vehicleId) return <EmptyGarage />;

  const sorted = [...deadlines].sort((a, b) => STATUS_ORDER[getLegalDeadlineStatus(a).status] - STATUS_ORDER[getLegalDeadlineStatus(b).status]);

  async function deleteDeadline(id?: number) {
    if (id == null) return;
    if (!confirm('Usunąć ten termin?')) return;
    await db.legalDeadlines.delete(id);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <h1 className="page-title">Terminy prawne</h1>
        <button className="btn btn-small" onClick={() => setShowAddForm((v) => !v)}>
          <IconPlus size={16} /> Dodaj
        </button>
      </div>

      {showAddForm && <DeadlineForm vehicleId={vehicleId} onDone={() => setShowAddForm(false)} />}

      <ul className="item-list">
        {sorted.map((d) => {
          const s = getLegalDeadlineStatus(d);
          const expanded = expandedId === d.id;
          return (
            <li key={d.id} className={`card task-card status-border-${s.status}`}>
              <button className="item-row task-row" onClick={() => setExpandedId(expanded ? null : d.id!)}>
                <div>
                  <p className="item-title">{d.type === 'Inne' ? d.name || 'Termin' : d.type}</p>
                  <p className="muted small">Ważne do {formatDate(d.validUntil)} · {formatRemainingDays(s.remainingDays)}</p>
                  {d.policyNumber && <p className="muted small">Polisa: {d.policyNumber}</p>}
                </div>
                <StatusBadge status={s.status} />
              </button>

              {expanded && (
                <div className="task-details">
                  {d.note && <p className="muted small">{d.note}</p>}
                  <div className="row-between">
                    <button className="btn btn-danger btn-small" onClick={() => deleteDeadline(d.id)}>
                      <IconTrash size={16} /> Usuń
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {sorted.length === 0 && <p className="muted">Brak zapisanych terminów.</p>}
    </div>
  );
}

function DeadlineForm({ vehicleId, onDone }: { vehicleId: number; onDone: () => void }) {
  const [type, setType] = useState<LegalDeadlineType>('OC/AC');
  const [name, setName] = useState('');
  const [validUntil, setValidUntil] = useState(new Date().toISOString().slice(0, 10));
  const [policyNumber, setPolicyNumber] = useState('');
  const [note, setNote] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState('30');

  async function save() {
    const entry: Omit<LegalDeadline, 'id'> = {
      vehicleId,
      type,
      name: type === 'Inne' ? name.trim() || undefined : undefined,
      validUntil: new Date(validUntil).toISOString(),
      policyNumber: policyNumber.trim() || undefined,
      note: note.trim() || undefined,
      reminderDaysBefore: Number(reminderDaysBefore) || 30,
    };
    await db.legalDeadlines.add(entry);
    onDone();
  }

  return (
    <div className="card">
      <div className="form-grid">
        <label>
          Typ
          <select className="input" value={type} onChange={(e) => setType(e.target.value as LegalDeadlineType)}>
            {LEGAL_DEADLINE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        {type === 'Inne' && (
          <label>
            Nazwa
            <input className="input" placeholder="np. Winieta" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label>
          Ważne do
          <input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </label>
        <label>
          Nr polisy (opcjonalnie)
          <input className="input" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
        </label>
        <label>
          Przypomnij ile dni przed
          <input className="input" type="number" value={reminderDaysBefore} onChange={(e) => setReminderDaysBefore(e.target.value)} />
        </label>
        <label>
          Notatka
          <input className="input" placeholder="opcjonalnie" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      <div className="row-between">
        <button className="btn btn-small btn-ghost" onClick={onDone}>Anuluj</button>
        <button className="btn btn-small" onClick={save}>Dodaj</button>
      </div>
    </div>
  );
}
