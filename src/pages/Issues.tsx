import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { formatDate } from '../utils/format';
import { ISSUE_PRIORITIES, type Issue, type IssuePriority } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyGarage from '../components/EmptyGarage';
import { Plus as IconPlus, Trash2 as IconTrash, AlertTriangle, ArrowUp, ArrowDown, Check as IconCheck, ChevronDown as IconChevronDown } from 'lucide-react';

const PRIORITY_STYLE: Record<IssuePriority, { cls: string; icon: typeof AlertTriangle }> = {
  'Wpływa na sprawność': { cls: 'overdue', icon: AlertTriangle },
  Ważne: { cls: 'soon', icon: ArrowUp },
  'Mało ważne': { cls: 'unknown', icon: ArrowDown },
};

function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const { cls, icon: Icon } = PRIORITY_STYLE[priority];
  return (
    <span className={`status-badge status-${cls}`}>
      <Icon size={12} /> {priority}
    </span>
  );
}

const PRIORITY_ORDER: Record<IssuePriority, number> = {
  'Wpływa na sprawność': 0,
  Ważne: 1,
  'Mało ważne': 2,
};

export default function Issues() {
  const { vehicleId, vehicle, loaded } = useActiveVehicle();
  const allIssues = useLiveQuery(() => (vehicleId ? db.issues.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  if (!loaded) return <Skeleton />;
  if (!vehicleId) return <EmptyGarage />;

  const open = [...allIssues.filter((i) => !i.resolved)].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt.localeCompare(a.createdAt),
  );
  const resolved = [...allIssues.filter((i) => i.resolved)].sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''));

  async function deleteIssue(id?: number) {
    if (id == null) return;
    if (!confirm('Usunąć tę usterkę?')) return;
    await db.issues.delete(id);
  }

  return (
    <div className="stack">
      <div className="row-between">
        <h1 className="page-title">Usterki</h1>
        <button className="btn btn-small" onClick={() => setShowAddForm((v) => !v)}>
          <IconPlus size={16} /> Dodaj usterkę
        </button>
      </div>

      {showAddForm && <AddIssueForm vehicleId={vehicleId} onDone={() => setShowAddForm(false)} />}

      {open.length === 0 ? (
        <p className="muted">Brak zgłoszonych usterek. Wszystko sprawne - albo jeszcze nic nie dodałeś.</p>
      ) : (
        <ul className="item-list">
          {open.map((i) => (
            <li key={i.id} className={`card task-card status-border-${PRIORITY_STYLE[i.priority].cls}`}>
              <button className="item-row task-row" onClick={() => setExpandedId(expandedId === i.id ? null : i.id!)}>
                <div>
                  <p className="item-title">{i.title}</p>
                  {i.description && <p className="muted small">{i.description}</p>}
                  <p className="muted small">Zgłoszono {formatDate(i.createdAt)}</p>
                </div>
                <PriorityBadge priority={i.priority} />
              </button>
              {expandedId === i.id && (
                <IssueDetails
                  issue={i}
                  vehicleMileage={vehicle?.mileage ?? 0}
                  onClose={() => setExpandedId(null)}
                  onDelete={() => deleteIssue(i.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {resolved.length > 0 && (
        <div>
          <button className="btn btn-small btn-ghost untracked-toggle" onClick={() => setShowResolved((v) => !v)}>
            <IconChevronDown size={14} className={showResolved ? 'chevron-up' : ''} />
            {showResolved ? 'Ukryj' : 'Pokaż'} rozwiązane ({resolved.length})
          </button>
          {showResolved && (
            <ul className="item-list" style={{ marginTop: 10 }}>
              {resolved.map((i) => (
                <li key={i.id} className="card task-card">
                  <div className="item-row">
                    <div>
                      <p className="item-title">{i.title}</p>
                      <p className="muted small">Naprawiono {formatDate(i.resolvedAt)}</p>
                    </div>
                    <button className="btn btn-danger btn-small" onClick={() => deleteIssue(i.id)}>
                      <IconTrash size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function IssueDetails({
  issue,
  vehicleMileage,
  onClose,
  onDelete,
}: {
  issue: Issue;
  vehicleMileage: number;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [cost, setCost] = useState('');
  const [workshop, setWorkshop] = useState('');

  async function resolve() {
    const nowIso = new Date().toISOString();
    await db.issues.update(issue.id!, { resolved: true, resolvedAt: nowIso });
    await db.historyEntries.add({
      vehicleId: issue.vehicleId,
      date: nowIso,
      mileage: vehicleMileage,
      type: 'Naprawa',
      category: 'Inne',
      description: issue.title,
      cost: Number(cost) || 0,
      workshop: workshop || undefined,
    });
    onClose();
  }

  return (
    <div className="task-details">
      {resolving ? (
        <>
          <p className="field-label">Zapisz jako naprawione</p>
          <div className="form-grid">
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
            <button className="btn btn-small btn-ghost" onClick={() => setResolving(false)}>Anuluj</button>
            <button className="btn btn-small" onClick={resolve}>
              <IconCheck size={15} /> Zapisz
            </button>
          </div>
        </>
      ) : (
        <div className="row-between">
          <button className="btn btn-danger btn-small" onClick={onDelete}>
            <IconTrash size={16} /> Usuń
          </button>
          <button className="btn btn-small" onClick={() => setResolving(true)}>
            <IconCheck size={15} /> Oznacz jako naprawione
          </button>
        </div>
      )}
    </div>
  );
}

function AddIssueForm({ vehicleId, onDone }: { vehicleId: number; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Ważne');

  async function save() {
    if (!title.trim()) return;
    await db.issues.add({
      vehicleId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      createdAt: new Date().toISOString(),
      resolved: false,
    });
    onDone();
  }

  return (
    <div className="card">
      <p className="field-label">Nowa usterka</p>
      <div className="form-grid" style={{ marginTop: 10 }}>
        <label className="span-2">
          Co się dzieje
          <input className="input" placeholder="np. Stuk w zawieszeniu przy skręcaniu" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="span-2">
          Opis (opcjonalnie)
          <input className="input" placeholder="szczegóły, okoliczności" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="span-2">
          Priorytet
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)}>
            {ISSUE_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="row-between">
        <button className="btn btn-small btn-ghost" onClick={onDone}>Anuluj</button>
        <button className="btn btn-small" onClick={save}>Dodaj</button>
      </div>
    </div>
  );
}
