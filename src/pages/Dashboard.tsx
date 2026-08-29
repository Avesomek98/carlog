import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { getServiceTaskStatus, getLegalDeadlineStatus, STATUS_ORDER } from '../utils/status';
import { formatCurrency, formatDate, formatDistance, formatRemainingDays, formatRemainingKm } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import StatTile from '../components/StatTile';
import GaugeRing from '../components/GaugeRing';
import Skeleton from '../components/Skeleton';
import EmptyGarage from '../components/EmptyGarage';
import { AlertTriangle as IconAlert, Gauge as IconGauge, ShieldCheck as IconShield, Wallet as IconWallet, Wrench as IconWrench } from 'lucide-react';
import type { Status } from '../types';

type UrgentItem = {
  key: string;
  title: string;
  subtitle: string;
  status: Status;
  remainingDays: number | null;
  remainingKm: number | null;
  ratio: number | null;
  href: string;
  kind: 'service' | 'legal';
};

const STATUS_COLOR_VAR: Record<Status, string> = {
  ok: 'var(--status-ok)',
  soon: 'var(--status-soon)',
  overdue: 'var(--status-overdue)',
  unknown: 'var(--status-unknown)',
};

function ratioOf(remaining: number | null, total: number | null): number | null {
  if (remaining == null || total == null || total <= 0) return null;
  return Math.max(0, Math.min(1, remaining / total));
}

export default function Dashboard() {
  const { vehicleId, vehicle, loaded } = useActiveVehicle();
  const tasks = useLiveQuery(() => (vehicleId ? db.serviceTasks.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? [];
  const deadlines = useLiveQuery(() => (vehicleId ? db.legalDeadlines.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? [];
  const thisYear = new Date().getFullYear();
  const yearEntries = useLiveQuery(
    () =>
      vehicleId
        ? db.historyEntries
            .where('vehicleId')
            .equals(vehicleId)
            .filter((e) => new Date(e.date).getFullYear() === thisYear)
            .toArray()
        : [],
    [vehicleId, thisYear],
  ) ?? [];
  const budgetPlan = useLiveQuery(
    () => (vehicleId ? db.budgetPlans.where({ vehicleId, year: thisYear }).first() : undefined),
    [vehicleId, thisYear],
  );

  const [mileageInput, setMileageInput] = useState('');
  const [editingMileage, setEditingMileage] = useState(false);

  if (!loaded) return <Skeleton />;
  if (!vehicle) return <EmptyGarage />;

  const items: UrgentItem[] = [
    ...tasks.map((t) => {
      const s = getServiceTaskStatus(t, vehicle.mileage);
      const kmRatio = t.intervalKm != null ? ratioOf(s.remainingKm, t.intervalKm) : null;
      const dayRatio = t.intervalMonths != null ? ratioOf(s.remainingDays, t.intervalMonths * 30) : null;
      const ratios = [kmRatio, dayRatio].filter((r): r is number => r != null);
      return {
        key: `task-${t.id}`,
        title: t.name,
        subtitle: [formatRemainingKm(s.remainingKm, vehicle.unit), formatRemainingDays(s.remainingDays)].filter(Boolean).join(' · ') || 'Brak danych o ostatnim wykonaniu',
        status: s.status,
        remainingDays: s.remainingDays,
        remainingKm: s.remainingKm,
        ratio: ratios.length ? Math.min(...ratios) : null,
        href: '/serwis',
        kind: 'service' as const,
      };
    }),
    ...deadlines.map((d) => {
      const s = getLegalDeadlineStatus(d);
      return {
        key: `legal-${d.id}`,
        title: d.type === 'Inne' ? d.name || 'Termin' : d.type,
        subtitle: `Ważne do ${formatDate(d.validUntil)} · ${formatRemainingDays(s.remainingDays)}`,
        status: s.status,
        remainingDays: s.remainingDays,
        remainingKm: null,
        ratio: ratioOf(s.remainingDays, 365),
        href: '/prawne',
        kind: 'legal' as const,
      };
    }),
  ];

  const sorted = [...items].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const urgent = sorted.filter((i) => i.status === 'overdue' || i.status === 'soon');
  const next = sorted.find((i) => i.status !== 'unknown') ?? sorted[0];
  const restUrgent = urgent.filter((i) => i.key !== next?.key);

  const spent = yearEntries.reduce((sum, e) => sum + e.cost, 0);
  const planned = budgetPlan?.annualAmount ?? 0;
  const overBudget = planned > 0 && spent > planned;

  const serviceItems = items.filter((i) => i.kind === 'service');
  const nearestService = [...serviceItems].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])[0];
  const legalItems = items.filter((i) => i.kind === 'legal');
  const nearestLegal = [...legalItems].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])[0];

  const specs = [
    vehicle.fuelType,
    vehicle.drivetrain,
    vehicle.engineCapacity && `${vehicle.engineCapacity} cm³`,
    vehicle.doors && `${vehicle.doors} drzwi`,
  ].filter((s): s is string => Boolean(s));

  async function saveMileage() {
    const value = Number(mileageInput);
    if (!vehicleId || !Number.isFinite(value) || value < 0) return;
    await db.vehicles.update(vehicleId, { mileage: value, mileageUpdatedAt: new Date().toISOString() });
    setEditingMileage(false);
    setMileageInput('');
  }

  return (
    <div className="stack">
      <section className="card hero-card">
        <div className="hero-gauge">
          <GaugeRing percent={next ? (next.ratio ?? 1) * 100 : 100} color={STATUS_COLOR_VAR[next?.status ?? 'ok']} size={116} strokeWidth={9}>
            <span className="hero-gauge-value">{formatDistance(vehicle.mileage, vehicle.unit)}</span>
            <span className="hero-gauge-caption muted small">przebieg</span>
          </GaugeRing>
        </div>
        <div className="hero-info">
          <h1 className="vehicle-name">{vehicle.make} {vehicle.model}</h1>
          <p className="muted small">Rocznik {vehicle.year} · aktualizacja {formatDate(vehicle.mileageUpdatedAt)}</p>

          {specs.length > 0 && (
            <div className="vehicle-specs">
              {specs.map((s) => (
                <span key={s} className="spec-chip">{s}</span>
              ))}
            </div>
          )}

          {editingMileage ? (
            <div className="mileage-row">
              <input
                className="input mileage-input"
                type="number"
                inputMode="numeric"
                autoFocus
                placeholder={String(vehicle.mileage)}
                value={mileageInput}
                onChange={(e) => setMileageInput(e.target.value)}
              />
              <button className="btn btn-small" onClick={saveMileage}>Zapisz</button>
              <button className="btn btn-small btn-ghost" onClick={() => setEditingMileage(false)}>Anuluj</button>
            </div>
          ) : (
            <button className="btn btn-small btn-ghost hero-update-btn" onClick={() => setEditingMileage(true)}>
              <IconGauge size={16} /> Aktualizuj przebieg
            </button>
          )}
        </div>
      </section>

      {next && (
        <Link to={next.href} className={`card next-task status-border-${next.status}`}>
          <div className="row-between">
            <div>
              <p className="muted small">Najbliższy termin</p>
              <p className="next-task-title">{next.title}</p>
              <p className="muted">{next.subtitle}</p>
            </div>
            <StatusBadge status={next.status} />
          </div>
        </Link>
      )}

      <div className="stat-grid">
        <StatTile
          icon={<IconWrench size={18} />}
          label="Serwis"
          value={nearestService ? nearestService.title : 'Brak pozycji'}
          sub={nearestService ? [formatRemainingKm(nearestService.remainingKm, vehicle.unit), formatRemainingDays(nearestService.remainingDays)].filter(Boolean).join(' · ') : undefined}
          tone={nearestService?.status === 'overdue' ? 'overdue' : nearestService?.status === 'soon' ? 'soon' : 'default'}
        />
        <StatTile
          icon={<IconShield size={18} />}
          label="Terminy prawne"
          value={nearestLegal ? nearestLegal.title : 'Brak wpisów'}
          sub={nearestLegal ? formatRemainingDays(nearestLegal.remainingDays) ?? undefined : undefined}
          tone={nearestLegal?.status === 'overdue' ? 'overdue' : nearestLegal?.status === 'soon' ? 'soon' : 'default'}
        />
        <StatTile
          icon={<IconWallet size={18} />}
          label={`Budżet ${thisYear}`}
          value={formatCurrency(spent)}
          sub={planned > 0 ? `z ${formatCurrency(planned)} planu` : 'plan nieustawiony'}
          tone={overBudget ? 'overdue' : 'default'}
        />
      </div>

      {restUrgent.length > 0 && (
        <section className="card">
          <h2 className="section-title"><IconAlert size={18} /> Wymaga uwagi</h2>
          <ul className="item-list">
            {restUrgent.map((i) => (
              <li key={i.key}>
                <Link to={i.href} className="item-row">
                  <div>
                    <p className="item-title">{i.title}</p>
                    <p className="muted small">{i.subtitle}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
