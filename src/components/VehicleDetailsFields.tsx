import { DRIVETRAINS, FUEL_TYPES, type Drivetrain, type FuelType } from '../types';

export interface VehicleDetailsValue {
  make: string;
  model: string;
  year: string;
  doors: string;
  drivetrain: Drivetrain | '';
  fuelType: FuelType | '';
  engineCapacity: string;
}

export default function VehicleDetailsFields({
  value,
  onChange,
}: {
  value: VehicleDetailsValue;
  onChange: (patch: Partial<VehicleDetailsValue>) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        Marka
        <input className="input" placeholder="np. Audi" value={value.make} onChange={(e) => onChange({ make: e.target.value })} />
      </label>
      <label>
        Model
        <input className="input" placeholder="np. A6" value={value.model} onChange={(e) => onChange({ model: e.target.value })} />
      </label>
      <label>
        Rocznik
        <input className="input" type="number" value={value.year} onChange={(e) => onChange({ year: e.target.value })} />
      </label>
      <label>
        Ilość drzwi
        <select className="input" value={value.doors} onChange={(e) => onChange({ doors: e.target.value })}>
          <option value="">nie wiem</option>
          {[2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Napęd
        <select className="input" value={value.drivetrain} onChange={(e) => onChange({ drivetrain: e.target.value as Drivetrain | '' })}>
          <option value="">nie wiem</option>
          {DRIVETRAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
      <label>
        Silnik
        <select className="input" value={value.fuelType} onChange={(e) => onChange({ fuelType: e.target.value as FuelType | '' })}>
          <option value="">nie wiem</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>
      <label>
        Pojemność (cm³)
        <input className="input" type="number" placeholder="np. 1998" value={value.engineCapacity} onChange={(e) => onChange({ engineCapacity: e.target.value })} />
      </label>
    </div>
  );
}
