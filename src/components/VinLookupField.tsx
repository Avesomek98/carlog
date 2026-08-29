import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { decodeVin, type VinDecodeResult } from '../utils/vinDecode';

type VinStatus = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

export default function VinLookupField({
  vin,
  onVinChange,
  onDecoded,
}: {
  vin: string;
  onVinChange: (vin: string) => void;
  onDecoded: (result: VinDecodeResult) => void;
}) {
  const [status, setStatus] = useState<VinStatus>({ kind: 'idle' });

  async function lookup() {
    if (!vin.trim() || status.kind === 'loading') return;
    setStatus({ kind: 'loading' });
    try {
      const result = await decodeVin(vin);
      onDecoded(result);
      const parts = [result.make, result.model, result.year].filter(Boolean);
      setStatus({ kind: 'success', message: `Znaleziono: ${parts.join(' ')}. Sprawdź i popraw dane, jeśli trzeba.` });
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Nie udało się sprawdzić VIN' });
    }
  }

  return (
    <label className="vin-label">
      VIN (opcjonalnie - podpowie dane)
      <div className="vin-row">
        <input
          className="input"
          placeholder="17 znaków, np. WBA..."
          maxLength={17}
          value={vin}
          onChange={(e) => {
            onVinChange(e.target.value.toUpperCase());
            setStatus({ kind: 'idle' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              lookup();
            }
          }}
        />
        <button className="btn btn-small btn-ghost vin-check-btn" onClick={lookup} disabled={!vin.trim() || status.kind === 'loading'}>
          {status.kind === 'loading' ? <Loader2 size={15} className="spin" /> : <Search size={15} />}
          Sprawdź
        </button>
      </div>
      {status.kind === 'success' && <p className="vin-feedback vin-feedback-ok">{status.message}</p>}
      {status.kind === 'error' && <p className="vin-feedback vin-feedback-error">{status.message}</p>}
    </label>
  );
}
