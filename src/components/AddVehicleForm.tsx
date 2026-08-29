import { useState } from 'react';
import { addVehicle } from '../db';
import { useVehicleContext } from '../context/VehicleContext';
import VinLookupField from './VinLookupField';
import VehicleDetailsFields, { type VehicleDetailsValue } from './VehicleDetailsFields';

export default function AddVehicleForm({ onDone }: { onDone: () => void }) {
  const { setActiveVehicleId } = useVehicleContext();
  const [vin, setVin] = useState('');
  const [details, setDetails] = useState<VehicleDetailsValue>({
    make: '',
    model: '',
    year: String(new Date().getFullYear()),
    doors: '',
    drivetrain: '',
    fuelType: '',
    engineCapacity: '',
    enginePowerKw: '',
  });
  const [mileage, setMileage] = useState('');

  function updateDetails(patch: Partial<VehicleDetailsValue>) {
    setDetails((d) => ({ ...d, ...patch }));
  }

  async function save() {
    const yearNum = Number(details.year);
    const mileageNum = Number(mileage) || 0;
    if (!details.make.trim() || !details.model.trim() || !Number.isFinite(yearNum)) return;
    const id = await addVehicle({
      make: details.make.trim(),
      model: details.model.trim(),
      year: yearNum,
      vin: vin.trim() || undefined,
      doors: details.doors ? Number(details.doors) : undefined,
      drivetrain: details.drivetrain || undefined,
      fuelType: details.fuelType || undefined,
      engineCapacity: details.engineCapacity ? Number(details.engineCapacity) : undefined,
      enginePowerKw: details.enginePowerKw ? Number(details.enginePowerKw) : undefined,
      mileage: mileageNum,
      unit: 'km',
    });
    setActiveVehicleId(id);
    onDone();
  }

  return (
    <div className="card">
      <p className="field-label">Nowy pojazd</p>

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
      <div className="form-grid" style={{ marginTop: -6 }}>
        <label>
          Przebieg (km)
          <input className="input" type="number" placeholder="0" value={mileage} onChange={(e) => setMileage(e.target.value)} />
        </label>
      </div>
      <div className="row-between">
        <button className="btn btn-small btn-ghost" onClick={onDone}>Anuluj</button>
        <button className="btn btn-small" onClick={save}>Dodaj pojazd</button>
      </div>
    </div>
  );
}
