import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { formatCurrency, formatDate } from '../utils/format';
import { Camera as IconCamera, Plus as IconPlus, Trash2 as IconTrash } from 'lucide-react';
import { BUDGET_CATEGORIES, HISTORY_TYPES, type BudgetCategory, type HistoryEntry, type HistoryType } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyGarage from '../components/EmptyGarage';

const EMPTY_ENTRIES: HistoryEntry[] = [];

export default function History() {
  const { vehicleId, loaded } = useActiveVehicle();
  const entries = useLiveQuery(() => (vehicleId ? db.historyEntries.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? EMPTY_ENTRIES;
  const [filter, setFilter] = useState<HistoryType | 'Wszystkie'>('Wszystkie');
  const [showAddForm, setShowAddForm] = useState(false);

  const sorted = useMemo(
    () => [...entries].filter((e) => filter === 'Wszystkie' || e.type === filter).sort((a, b) => b.date.localeCompare(a.date)),
    [entries, filter],
  );

  if (!loaded) return <Skeleton />;
  if (!vehicleId) return <EmptyGarage />;

  async function deleteEntry(id?: number) {
    if (id == null) return;
    if (!confirm('Usunąć ten wpis z historii?')) return;
    await db.historyEntries.delete(id);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <h1 className="page-title">Historia serwisowa</h1>
        <button className="btn btn-small" onClick={() => setShowAddForm((v) => !v)}>
          <IconPlus size={16} /> Dodaj
        </button>
      </div>

      <div className="chip-row">
        {(['Wszystkie', ...HISTORY_TYPES] as const).map((t) => (
          <button key={t} className={`chip${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
            {t}
          </button>
        ))}
      </div>

      {showAddForm && <EntryForm vehicleId={vehicleId} onDone={() => setShowAddForm(false)} />}

      <ul className="item-list">
        {sorted.map((e) => (
          <HistoryRow key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />
        ))}
      </ul>
      {sorted.length === 0 && <p className="muted">Brak wpisów.</p>}
    </div>
  );
}

function HistoryRow({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const photoUrl = useMemo(() => (entry.photo ? URL.createObjectURL(entry.photo) : null), [entry.photo]);

  return (
    <li className="card history-row">
      <div className="row-between">
        <div>
          <p className="item-title">{entry.description}</p>
          <p className="muted small">
            {formatDate(entry.date)} · {entry.mileage.toLocaleString('pl-PL')} km · {entry.type} · {entry.category}
          </p>
          {entry.workshop && <p className="muted small">{entry.workshop}</p>}
        </div>
        <p className="history-cost">{formatCurrency(entry.cost)}</p>
      </div>
      {photoUrl && (
        <a href={photoUrl} target="_blank" rel="noreferrer">
          <img src={photoUrl} alt="Paragon/faktura" className="receipt-thumb" />
        </a>
      )}
      <button className="btn btn-danger btn-small" onClick={onDelete}>
        <IconTrash size={16} /> Usuń
      </button>
    </li>
  );
}

function EntryForm({ vehicleId, onDone }: { vehicleId: number; onDone: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState('');
  const [type, setType] = useState<HistoryType>('Naprawa');
  const [category, setCategory] = useState<BudgetCategory>('Inne');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  async function save() {
    if (!description.trim()) return;
    const mileageNum = Number(mileage);
    if (!Number.isFinite(mileageNum)) return;

    await db.historyEntries.add({
      vehicleId,
      date: new Date(date).toISOString(),
      mileage: mileageNum,
      type,
      category,
      description: description.trim(),
      cost: Number(cost) || 0,
      workshop: workshop.trim() || undefined,
      photo: photo ?? undefined,
    });
    onDone();
  }

  return (
    <div className="card">
      <div className="form-grid">
        <label>
          Data
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Przebieg (km)
          <input className="input" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
        </label>
        <label>
          Typ
          <select className="input" value={type} onChange={(e) => setType(e.target.value as HistoryType)}>
            {HISTORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Kategoria (budżet)
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory)}>
            {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="span-2">
          Opis
          <input className="input" placeholder="np. Wymiana klocków przód" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Koszt (PLN)
          <input className="input" type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
        <label>
          Warsztat
          <input className="input" placeholder="opcjonalnie" value={workshop} onChange={(e) => setWorkshop(e.target.value)} />
        </label>
        <label className="span-2 photo-label">
          <IconCamera /> Zdjęcie paragonu/faktury (opcjonalnie)
          <input className="input" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      <div className="row-between">
        <button className="btn btn-small btn-ghost" onClick={onDone}>Anuluj</button>
        <button className="btn btn-small" onClick={save}>Dodaj wpis</button>
      </div>
    </div>
  );
}
