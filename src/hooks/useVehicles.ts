import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const ACTIVE_KEY = 'carlog:activeVehicleId';
const EMPTY: [] = [];

export function useVehicles() {
  const vehiclesRaw = useLiveQuery(() => db.vehicles.toArray(), []);
  const loaded = vehiclesRaw !== undefined;
  const vehicles = vehiclesRaw ?? EMPTY;

  const [activeId, setActiveIdState] = useState<number | undefined>(() => {
    const stored = localStorage.getItem(ACTIVE_KEY);
    return stored ? Number(stored) : undefined;
  });

  useEffect(() => {
    if (!loaded) return;
    if (vehicles.length === 0) {
      if (activeId != null) setActiveIdState(undefined);
      return;
    }
    if (activeId == null || !vehicles.some((v) => v.id === activeId)) {
      setActiveIdState(vehicles[0].id);
    }
  }, [loaded, vehicles, activeId]);

  function setActiveVehicleId(id: number) {
    setActiveIdState(id);
    localStorage.setItem(ACTIVE_KEY, String(id));
  }

  const activeVehicle = vehicles.find((v) => v.id === activeId);

  return { vehicles, loaded, activeId, activeVehicle, setActiveVehicleId };
}
