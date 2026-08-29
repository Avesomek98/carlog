import type { Drivetrain, FuelType } from '../types';

export interface VinDecodeResult {
  make?: string;
  model?: string;
  year?: number;
  doors?: number;
  drivetrain?: Drivetrain;
  fuelType?: FuelType;
  engineCapacity?: number;
}

// Darmowe, publiczne API NHTSA (USA) - bez klucza. Dekoduje VIN globalnie wg
// standardu ISO 3779, ale baza modeli jest najpełniejsza dla aut sprzedawanych
// w USA - dla czysto europejskich rynków wynik bywa częściowy (np. sama marka).
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const clean = vin.trim().toUpperCase();
  if (clean.length !== 17) {
    throw new Error('VIN powinien mieć dokładnie 17 znaków');
  }

  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(clean)}?format=json`);
  if (!res.ok) {
    throw new Error('Nie udało się połączyć z bazą VIN');
  }

  const data = await res.json();
  const r = data?.Results?.[0];
  const make = r?.Make ? toTitleCase(r.Make) : undefined;
  const model = r?.Model || undefined;
  const year = r?.ModelYear ? Number(r.ModelYear) : undefined;
  const doors = parseDoors(r?.Doors);
  const drivetrain = normalizeDrivetrain(r?.DriveType);
  const fuelType = normalizeFuelType(r?.FuelTypePrimary, r?.ElectrificationLevel);
  const engineCapacity = parseEngineCapacity(r?.DisplacementCC, r?.DisplacementL);

  if (!make && !model && !year) {
    throw new Error('Nie znaleziono danych dla tego VIN - wpisz dane ręcznie');
  }

  return { make, model, year, doors, drivetrain, fuelType, engineCapacity };
}

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function parseDoors(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw.split(';')[0]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function normalizeDrivetrain(raw: string | undefined): Drivetrain | undefined {
  if (!raw) return undefined;
  const v = raw.toUpperCase();
  if (v.includes('AWD') || v.includes('4WD') || v.includes('4X4') || v.includes('ALL WHEEL')) return 'AWD';
  if (v.includes('FWD') || v.includes('FRONT')) return 'FWD';
  if (v.includes('RWD') || v.includes('REAR') || v.includes('4X2')) return 'RWD';
  return undefined;
}

function normalizeFuelType(fuelTypePrimary: string | undefined, electrificationLevel: string | undefined): FuelType | undefined {
  if (electrificationLevel && /hybrid/i.test(electrificationLevel)) return 'Hybryda';
  if (!fuelTypePrimary) return undefined;
  const v = fuelTypePrimary.toLowerCase();
  if (v.includes('electric')) return 'Elektryczny';
  if (v.includes('diesel')) return 'Diesel';
  if (v.includes('gasoline') || v.includes('petrol') || v.includes('flexible fuel')) return 'Benzyna';
  if (v.includes('natural gas') || v.includes('propane') || v.includes('lpg')) return 'LPG';
  return 'Inny';
}

function parseEngineCapacity(cc: string | undefined, liters: string | undefined): number | undefined {
  if (cc) {
    const n = Number(cc);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  if (liters) {
    const n = Number(liters);
    if (Number.isFinite(n) && n > 0) return Math.round(n * 1000);
  }
  return undefined;
}
