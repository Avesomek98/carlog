import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { formatCurrency } from '../utils/format';
import { STATUS_ORDER } from '../utils/status';
import { useUpcomingEstimate } from '../hooks/useUpcomingEstimate';
import StatusBadge from '../components/StatusBadge';
import { BUDGET_CATEGORIES, type HistoryEntry, type ServiceTask } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyGarage from '../components/EmptyGarage';
import DonutChart from '../components/DonutChart';
import { CATEGORY_COLORS } from '../utils/chartColors';

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
const EMPTY_ENTRIES: HistoryEntry[] = [];
const EMPTY_TASKS: ServiceTask[] = [];

export default function Budget() {
  const { vehicleId, vehicle, loaded } = useActiveVehicle();
  const [year, setYear] = useState(new Date().getFullYear());
  const entries = useLiveQuery(() => (vehicleId ? db.historyEntries.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? EMPTY_ENTRIES;
  const plan = useLiveQuery(() => (vehicleId ? db.budgetPlans.where({ vehicleId, year }).first() : undefined), [vehicleId, year]);
  const tasks = useLiveQuery(() => (vehicleId ? db.serviceTasks.where('vehicleId').equals(vehicleId).toArray() : []), [vehicleId]) ?? EMPTY_TASKS;

  const [editingPlan, setEditingPlan] = useState(false);
  const [planInput, setPlanInput] = useState('');

  const yearEntries = useMemo(() => entries.filter((e) => new Date(e.date).getFullYear() === year), [entries, year]);
  const spent = yearEntries.reduce((sum, e) => sum + e.cost, 0);
  const planned = plan?.annualAmount ?? 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of BUDGET_CATEGORIES) map.set(c, 0);
    for (const e of yearEntries) map.set(e.category, (map.get(e.category) ?? 0) + e.cost);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [yearEntries]);
  const categorySum = byCategory.reduce((sum, [, v]) => sum + v, 0);

  const byMonth = useMemo(() => {
    const arr = Array(12).fill(0);
    for (const e of yearEntries) arr[new Date(e.date).getMonth()] += e.cost;
    return arr;
  }, [yearEntries]);
  const maxMonth = Math.max(1, ...byMonth);

  const { upcoming: upcomingRaw, total: upcomingTotal, unknownCount: upcomingUnknownCount } = useUpcomingEstimate(tasks, entries, vehicle?.mileage ?? 0);
  const upcoming = useMemo(
    () => [...upcomingRaw].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [upcomingRaw],
  );

  async function savePlan() {
    const amount = Number(planInput);
    if (!vehicleId || !Number.isFinite(amount) || amount < 0) return;
    if (plan?.id != null) {
      await db.budgetPlans.update(plan.id, { annualAmount: amount });
    } else {
      await db.budgetPlans.add({ vehicleId, year, annualAmount: amount });
    }
    setEditingPlan(false);
    setPlanInput('');
  }

  if (!loaded) return <Skeleton />;
  if (!vehicleId) return <EmptyGarage />;

  return (
    <div className="stack">
      <div className="row-between">
        <h1 className="page-title">Budżet</h1>
        <div className="year-picker">
          <button className="btn btn-small btn-ghost" onClick={() => setYear((y) => y - 1)}>‹</button>
          <span>{year}</span>
          <button className="btn btn-small btn-ghost" onClick={() => setYear((y) => y + 1)}>›</button>
        </div>
      </div>

      <section className="card">
        <p className="muted small">Wydano vs plan roczny</p>
        <p className="budget-amount">
          {formatCurrency(spent)} <span className="muted">z {formatCurrency(planned)}</span>
        </p>
        <div className="progress-bar">
          <div
            className={`progress-fill${planned > 0 && spent > planned ? ' over' : ''}`}
            style={{ width: `${planned > 0 ? Math.min(100, (spent / planned) * 100) : 0}%` }}
          />
        </div>
        {editingPlan ? (
          <div className="row-between" style={{ marginTop: 12 }}>
            <input className="input" type="number" placeholder="Plan roczny (PLN)" value={planInput} onChange={(e) => setPlanInput(e.target.value)} />
            <button className="btn btn-small" onClick={savePlan}>Zapisz</button>
          </div>
        ) : (
          <button className="btn btn-small btn-ghost" style={{ marginTop: 12 }} onClick={() => { setEditingPlan(true); setPlanInput(String(planned || '')); }}>
            Ustaw plan roczny
          </button>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="card">
          <h2 className="section-title">Przewidywane wydatki</h2>
          <p className="muted small">
            Szacunek na bazie Twojej historii dla nadchodzących/zaległych czynności serwisowych.
          </p>
          <ul className="item-list" style={{ marginTop: 10 }}>
            {upcoming.map(({ task, status, estimate }) => (
              <li key={task.id} className="row-between estimate-row">
                <div>
                  <p className="item-title">{task.name}</p>
                  <StatusBadge status={status} />
                </div>
                <p className="estimate-value">
                  {estimate ? formatCurrency(estimate.averageCost) : <span className="muted small">brak danych</span>}
                </p>
              </li>
            ))}
          </ul>
          <div className="row-between estimate-total">
            <span className="field-label">Suma szacowana</span>
            <span className="budget-amount" style={{ margin: 0 }}>{formatCurrency(upcomingTotal)}</span>
          </div>
          {upcomingUnknownCount > 0 && (
            <p className="muted small">
              +{upcomingUnknownCount} {upcomingUnknownCount === 1 ? 'czynność' : 'czynności'} bez wystarczającej historii kosztów (dodaj koszt przy najbliższym wpisie, żeby poprawić prognozę).
            </p>
          )}
        </section>
      )}

      <section className="card">
        <h2 className="section-title">Podział na kategorie</h2>
        <div className="donut-section">
          <DonutChart
            data={byCategory.map(([cat, value]) => ({ label: cat, value, color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }))}
          >
            <span className="donut-total">{formatCurrency(categorySum)}</span>
            <span className="muted small">łącznie</span>
          </DonutChart>
          <ul className="donut-legend">
            {byCategory.map(([cat, value]) => (
              <li key={cat} className="donut-legend-row">
                <span className="donut-legend-dot" style={{ background: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] }} />
                <span className="donut-legend-label">{cat}</span>
                <span className="donut-legend-value">{formatCurrency(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Wydatki w miesiącach</h2>
        <div className="trend-chart">
          {byMonth.map((v, i) => (
            <div key={i} className="trend-col">
              <div className="trend-bar" style={{ height: `${(v / maxMonth) * 100}%` }} title={formatCurrency(v)} />
              <span className="trend-label">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
