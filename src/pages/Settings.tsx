import { useRef, useState } from 'react';
import { db, deleteVehicle } from '../db';
import { useActiveVehicle } from '../hooks/useActiveVehicle';
import { useVehicleContext } from '../context/VehicleContext';
import { exportAllData, importAllData, downloadBlob } from '../utils/exportImport';
import AddVehicleForm from '../components/AddVehicleForm';
import VinLookupField from '../components/VinLookupField';
import VehicleDetailsFields, { type VehicleDetailsValue } from '../components/VehicleDetailsFields';
import { Check as IconCheck, Plus as IconPlus, Trash2 as IconTrash } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { kwToHp } from '../utils/power';
import type { Unit } from '../types';

const EMPTY_DETAILS: VehicleDetailsValue = { make: '', model: '', year: '', doors: '', drivetrain: '', fuelType: '', engineCapacity: '', enginePowerKw: '' };

export default function Settings() {
  const { vehicleId, vehicle, loaded } = useActiveVehicle();
  const { vehicles, activeId, setActiveVehicleId } = useVehicleContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const [details, setDetails] = useState<VehicleDetailsValue>(EMPTY_DETAILS);
  const [vin, setVin] = useState('');
  const [editingVehicle, setEditingVehicle] = useState(false);

  if (!loaded) return <Skeleton />;

  function updateDetails(patch: Partial<VehicleDetailsValue>) {
    setDetails((d) => ({ ...d, ...patch }));
  }

  function startEditVehicle() {
    setDetails({
      make: vehicle!.make,
      model: vehicle!.model,
      year: String(vehicle!.year),
      doors: vehicle!.doors ? String(vehicle!.doors) : '',
      drivetrain: vehicle!.drivetrain ?? '',
      fuelType: vehicle!.fuelType ?? '',
      engineCapacity: vehicle!.engineCapacity ? String(vehicle!.engineCapacity) : '',
      enginePowerKw: vehicle!.enginePowerKw ? String(vehicle!.enginePowerKw) : '',
    });
    setVin(vehicle!.vin ?? '');
    setEditingVehicle(true);
  }

  async function saveVehicle() {
    const yearNum = Number(details.year);
    if (!details.make.trim() || !details.model.trim() || !Number.isFinite(yearNum)) return;
    await db.vehicles.update(vehicleId!, {
      make: details.make.trim(),
      model: details.model.trim(),
      year: yearNum,
      vin: vin.trim() || undefined,
      doors: details.doors ? Number(details.doors) : undefined,
      drivetrain: details.drivetrain || undefined,
      fuelType: details.fuelType || undefined,
      engineCapacity: details.engineCapacity ? Number(details.engineCapacity) : undefined,
      enginePowerKw: details.enginePowerKw ? Number(details.enginePowerKw) : undefined,
    });
    setEditingVehicle(false);
  }

  async function setUnit(unit: Unit) {
    await db.vehicles.update(vehicleId!, { unit });
  }

  async function toggleNotifications() {
    await db.vehicles.update(vehicleId!, { notificationsEnabled: !vehicle!.notificationsEnabled });
  }

  async function handleDeleteVehicle(id: number) {
    if (!confirm('Usunąć ten pojazd wraz z całą jego historią, harmonogramem i terminami? Tej operacji nie można cofnąć.')) return;
    await deleteVehicle(id);
  }

  async function handleExport() {
    const blob = await exportAllData();
    downloadBlob(blob, `carlog-eksport-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function handleImportFile(file: File) {
    if (!confirm('Import zastąpi wszystkie obecne dane w aplikacji. Kontynuować?')) return;
    setImporting(true);
    setImportMessage('');
    try {
      await importAllData(file);
      setImportMessage('Dane zaimportowane pomyślnie.');
    } catch {
      setImportMessage('Nie udało się zaimportować pliku - sprawdź, czy to poprawny eksport CarLog.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="stack">
      <h1 className="page-title">Ustawienia</h1>

      <section className="card">
        <div className="row-between">
          <h2 className="section-title">Pojazdy</h2>
          <button className="btn btn-small btn-ghost" onClick={() => setShowAddVehicle((v) => !v)}>
            <IconPlus size={15} /> Dodaj
          </button>
        </div>

        {showAddVehicle && <AddVehicleForm onDone={() => setShowAddVehicle(false)} />}

        {vehicles.length === 0 ? (
          <p className="muted small">Nie masz jeszcze żadnego pojazdu - dodaj pierwszy powyżej.</p>
        ) : (
          <ul className="item-list">
            {vehicles.map((v) => (
              <li key={v.id} className={`vehicle-list-row${v.id === activeId ? ' active' : ''}`}>
                <button className="vehicle-list-select" onClick={() => setActiveVehicleId(v.id!)}>
                  {v.id === activeId && <IconCheck size={14} />}
                  <span>{v.make} {v.model} <span className="muted small">{v.year}</span></span>
                </button>
                <button className="btn btn-danger btn-small" onClick={() => handleDeleteVehicle(v.id!)} title="Usuń pojazd">
                  <IconTrash size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {vehicle && vehicleId && (
        <>
          <section className="card">
            <h2 className="section-title">Dane pojazdu</h2>
            {editingVehicle ? (
              <>
                <VinLookupField
                  vin={vin}
                  onVinChange={setVin}
                  onDecoded={(result) => {
                    updateDetails({
                      ...(result.make ? { make: result.make } : {}),
                      ...(result.model ? { model: result.model } : {}),
                      ...(result.year ? { year: String(result.year) } : {}),
                      ...(result.doors ? { doors: String(result.doors) } : {}),
                      ...(result.drivetrain ? { drivetrain: result.drivetrain } : {}),
                      ...(result.fuelType ? { fuelType: result.fuelType } : {}),
                      ...(result.engineCapacity ? { engineCapacity: String(result.engineCapacity) } : {}),
                      ...(result.enginePowerKw ? { enginePowerKw: String(result.enginePowerKw) } : {}),
                    });
                  }}
                />
                <div style={{ marginTop: 12 }}>
                  <VehicleDetailsFields value={details} onChange={updateDetails} />
                </div>
                <div className="row-between">
                  <button className="btn btn-small btn-ghost" onClick={() => setEditingVehicle(false)}>Anuluj</button>
                  <button className="btn btn-small" onClick={saveVehicle}>Zapisz</button>
                </div>
              </>
            ) : (
              <div className="row-between">
                <div>
                  <p>{vehicle.make} {vehicle.model}, {vehicle.year}</p>
                  <p className="muted small">
                    {[
                      vehicle.doors && `${vehicle.doors} drzwi`,
                      vehicle.drivetrain,
                      vehicle.fuelType,
                      vehicle.engineCapacity && `${vehicle.engineCapacity} cm³`,
                      vehicle.enginePowerKw && `${vehicle.enginePowerKw} kW (${kwToHp(vehicle.enginePowerKw)} KM)`,
                    ].filter(Boolean).join(' · ') || 'Brak dodatkowych danych'}
                  </p>
                  {vehicle.vin && <p className="muted small">VIN: {vehicle.vin}</p>}
                </div>
                <button className="btn btn-small btn-ghost" onClick={startEditVehicle}>Edytuj</button>
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">Jednostki</h2>
            <div className="chip-row">
              <button className={`chip${vehicle.unit === 'km' ? ' active' : ''}`} onClick={() => setUnit('km')}>Kilometry</button>
              <button className={`chip${vehicle.unit === 'mi' ? ' active' : ''}`} onClick={() => setUnit('mi')}>Mile</button>
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Powiadomienia</h2>
            <label className="row-between toggle-row">
              <span>Przypomnienia o terminach</span>
              <input type="checkbox" checked={vehicle.notificationsEnabled} onChange={toggleNotifications} />
            </label>
            <p className="muted small">Statusy "zbliża się" / "przeterminowane" są zawsze widoczne w aplikacji. Ta opcja steruje dodatkowo powiadomieniami push (gdy przeglądarka je obsługuje).</p>
          </section>
        </>
      )}

      <section className="card">
        <h2 className="section-title">Dane</h2>
        <div className="stack-small">
          <button className="btn btn-small" onClick={handleExport}>Eksportuj dane (JSON)</button>
          <button className="btn btn-small btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? 'Importowanie...' : 'Importuj dane z pliku'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
          {importMessage && <p className="muted small">{importMessage}</p>}
        </div>
      </section>
    </div>
  );
}
