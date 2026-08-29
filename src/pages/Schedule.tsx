import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { getServiceTaskStatus, STATUS_ORDER } from '../utils/status';
import { formatDate, formatRemainingDays, formatRemainingKm } from '../utils/format';
import { buildServiceIcs } from '../utils/ics';
import { downloadBlob } from '../utils/exportImport';
import StatusBadge from '../components/StatusBadge';
import AddServiceForm from '../components/AddServiceForm';
import PlanServiceForm from '../components/PlanServiceForm';
import { Plus as IconPlus, Trash2 as IconTrash, ChevronDown as IconChevronDown, CalendarPlus, CalendarClock, Check as IconCheck } from 'lucide-react';
import type { PlannedService, ServiceTask } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyGarage from '../components/EmptyGarage';

function intervalLabel(t: ServiceTask): string {
  const parts: string[] = [];
  if (t.intervalKm) parts.push(`${t.intervalKm.toLocaleString('pl-PL')} km`);
  if (t.intervalMonths) parts.push(`${t.intervalMonths} mies.`);
  return parts.length ? `co ${parts.join(' lub ')}` : 'brak reguły';
}

function daysUntil(iso: string): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Math.round((new Date(iso).getTime() - Date.now()) / DAY_MS);
}

export default function Schedule() {
  const { vehicleId, vehicle, loaded } = useActiveVehicle();
  const tasks = useLiveQuery(() => (vehicleId ? db.serviceTasks.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? [];
  const plannedServices = useLiveQuery(() => (vehicleId ? db.plannedServices.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? [];
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedPlannedId, setExpandedPlannedId] = useState<number | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showPlanService, setShowPlanService] = useState(false);
  const [showUntracked, setShowUntracked] = useState(false);

  if (!loaded) return <Skeleton />;
  if (!vehicle || !vehicleId) return <EmptyGarage />;

  async function deleteTask(id?: number) {
    if (id == null) return;
    if (!confirm('Usunąć tę pozycję z harmonogramu?')) return;
    await db.serviceTasks.delete(id);
  }

  async function deletePlanned(id?: number) {
    if (id == null) return;
    if (!confirm('Usunąć zaplanowaną wizytę?')) return;
    await db.plannedServices.delete(id);
  }

  function exportPlannedToCalendar(p: PlannedService) {
    const blob = buildServiceIcs({
      title: p.name,
      date: p.plannedDate,
      note: p.note,
      vehicleLabel: `${vehicle!.make} ${vehicle!.model}`,
    });
    downloadBlob(blob, `serwis-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`);
  }

  const tracked = tasks.filter((t) => getServiceTaskStatus(t, vehicle.mileage).status !== 'unknown');
  const untracked = tasks.filter((t) => getServiceTaskStatus(t, vehicle.mileage).status === 'unknown');

  const sortedTracked = [...tracked].sort(
    (a, b) => STATUS_ORDER[getServiceTaskStatus(a, vehicle.mileage).status] - STATUS_ORDER[getServiceTaskStatus(b, vehicle.mileage).status],
  );
  const sortedPlanned = [...plannedServices].sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));

  function renderTaskRow(t: ServiceTask) {
    const s = getServiceTaskStatus(t, vehicle!.mileage);
    const expanded = expandedId === t.id;
    return (
      <li key={t.id} className={`card task-card status-border-${s.status}`}>
        <button className="item-row task-row" onClick={() => setExpandedId(expanded ? null : t.id!)}>
          <div>
            <p className="item-title">{t.name}</p>
            <p className="muted small">{intervalLabel(t)}</p>
            <p className="muted small">
              {[formatRemainingKm(s.remainingKm, vehicle!.unit), formatRemainingDays(s.remainingDays)].filter(Boolean).join(' · ') || 'Uzupełnij ostatnie wykonanie'}
            </p>
          </div>
          <StatusBadge status={s.status} />
        </button>

        {expanded && (
          <TaskDetails
            task={t}
            vehicleMileage={vehicle!.mileage}
            onClose={() => setExpandedId(null)}
            onDelete={() => deleteTask(t.id)}
          />
        )}
      </li>
    );
  }

  return (
    <div className="stack">
      <div className="row-between">
        <h1 className="page-title">Serwis</h1>
      </div>

      <div className="chip-row">
        <button className="btn btn-small" onClick={() => setShowAddService((v) => !v)}>
          <IconPlus size={16} /> Dodaj serwis
        </button>
        <button className="btn btn-small btn-ghost" onClick={() => setShowPlanService((v) => !v)}>
          <CalendarClock size={16} /> Zaplanuj serwis
        </button>
      </div>

      {showAddService && (
        <AddServiceForm vehicleId={vehicleId} tasks={tasks} vehicleMileage={vehicle.mileage} onDone={() => setShowAddService(false)} />
      )}
      {showPlanService && (
        <PlanServiceForm vehicleId={vehicleId} tasks={tasks} onDone={() => setShowPlanService(false)} />
      )}

      {sortedPlanned.length > 0 && (
        <section>
          <h2 className="section-title">Zaplanowane wizyty</h2>
          <ul className="item-list">
            {sortedPlanned.map((p) => {
              const days = daysUntil(p.plannedDate);
              const expanded = expandedPlannedId === p.id;
              return (
                <li key={p.id} className="card task-card status-border-soon">
                  <button className="item-row task-row" onClick={() => setExpandedPlannedId(expanded ? null : p.id!)}>
                    <div>
                      <p className="item-title">{p.name}</p>
                      <p className="muted small">{formatDate(p.plannedDate)} · {formatRemainingDays(days)}</p>
                      {p.note && <p className="muted small">{p.note}</p>}
                    </div>
                  </button>
                  {expanded && (
                    <PlannedDetails
                      planned={p}
                      vehicleMileage={vehicle.mileage}
                      onClose={() => setExpandedPlannedId(null)}
                      onDelete={() => deletePlanned(p.id)}
                      onExportCalendar={() => exportPlannedToCalendar(p)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-title">Śledzone czynności</h2>
        {sortedTracked.length === 0 ? (
          <p className="muted">Nie masz jeszcze żadnych zapisanych czynności serwisowych. Kliknij "Dodaj serwis", żeby dodać pierwszą.</p>
        ) : (
          <ul className="item-list">{sortedTracked.map(renderTaskRow)}</ul>
        )}
      </section>

      {untracked.length > 0 && (
        <div>
          <button className="btn btn-small btn-ghost untracked-toggle" onClick={() => setShowUntracked((v) => !v)}>
            <IconChevronDown size={14} className={showUntracked ? 'chevron-up' : ''} />
            {showUntracked ? 'Ukryj' : 'Pokaż'} pozostałe pozycje szablonu ({untracked.length})
          </button>
          {showUntracked && <ul className="item-list" style={{ marginTop: 10 }}>{untracked.map(renderTaskRow)}</ul>}
        </div>
      )}
    </div>
  );
}

function TaskDetails({
  task,
  vehicleMileage,
  onClose,
  onDelete,
}: {
  task: ServiceTask;
  vehicleMileage: number;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState(String(vehicleMileage));
  const [cost, setCost] = useState('');
  const [workshop, setWorkshop] = useState('');

  async function markDone() {
    const mileageNum = Number(mileage);
    if (!Number.isFinite(mileageNum)) return;
    const dateIso = new Date(date).toISOString();

    await db.serviceTasks.update(task.id!, { lastDoneDate: dateIso, lastDoneMileage: mileageNum });
    await db.historyEntries.add({
      vehicleId: task.vehicleId,
      date: dateIso,
      mileage: mileageNum,
      type: 'Przegląd',
      category: 'Inne',
      description: task.name,
      cost: Number(cost) || 0,
      workshop: workshop || undefined,
      serviceTaskId: task.id,
    });
    onClose();
  }

  return (
    <div className="task-details">
      <p className="muted small">Ostatnio: {task.lastDoneDate ? `${formatDate(task.lastDoneDate)}, ${task.lastDoneMileage?.toLocaleString('pl-PL')} km` : 'brak danych'}</p>

      <p className="field-label">Oznacz jako wykonane</p>
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
          Koszt (PLN)
          <input className="input" type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
        <label>
          Warsztat
          <input className="input" placeholder="opcjonalnie" value={workshop} onChange={(e) => setWorkshop(e.target.value)} />
        </label>
      </div>

      <div className="row-between">
        <button className="btn btn-danger btn-small" onClick={onDelete}>
          <IconTrash size={16} /> Usuń pozycję
        </button>
        <button className="btn btn-small" onClick={markDone}>Zapisz wykonanie</button>
      </div>
    </div>
  );
}

function PlannedDetails({
  planned,
  vehicleMileage,
  onClose,
  onDelete,
  onExportCalendar,
}: {
  planned: PlannedService;
  vehicleMileage: number;
  onClose: () => void;
  onDelete: () => void;
  onExportCalendar: () => void;
}) {
  const [date, setDate] = useState(planned.plannedDate.slice(0, 10));
  const [mileage, setMileage] = useState(String(vehicleMileage));
  const [cost, setCost] = useState('');
  const [workshop, setWorkshop] = useState('');

  async function markDone() {
    const mileageNum = Number(mileage);
    if (!Number.isFinite(mileageNum)) return;
    const dateIso = new Date(date).toISOString();

    if (planned.serviceTaskId != null) {
      await db.serviceTasks.update(planned.serviceTaskId, { lastDoneDate: dateIso, lastDoneMileage: mileageNum });
    }
    await db.historyEntries.add({
      vehicleId: planned.vehicleId,
      date: dateIso,
      mileage: mileageNum,
      type: 'Przegląd',
      category: 'Inne',
      description: planned.name,
      cost: Number(cost) || 0,
      workshop: workshop || undefined,
      serviceTaskId: planned.serviceTaskId,
    });
    await db.plannedServices.delete(planned.id!);
    onClose();
  }

  return (
    <div className="task-details">
      <button className="btn btn-small btn-ghost" onClick={onExportCalendar}>
        <CalendarPlus size={15} /> Dodaj do kalendarza
      </button>

      <p className="field-label">Oznacz jako wykonane</p>
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
          Koszt (PLN)
          <input className="input" type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
        <label>
          Warsztat
          <input className="input" placeholder="opcjonalnie" value={workshop} onChange={(e) => setWorkshop(e.target.value)} />
        </label>
      </div>

      <div className="row-between">
        <button className="btn btn-danger btn-small" onClick={onDelete}>
          <IconTrash size={16} /> Usuń plan
        </button>
        <button className="btn btn-small" onClick={markDone}>
          <IconCheck size={15} /> Zapisz wykonanie
        </button>
      </div>
    </div>
  );
}
