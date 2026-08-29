import { createContext, useContext, type ReactNode } from 'react';
import { useVehicles } from '../hooks/useVehicles';
import type { Vehicle } from '../types';

interface VehicleContextValue {
  vehicles: Vehicle[];
  loaded: boolean;
  activeId: number | undefined;
  activeVehicle: Vehicle | undefined;
  setActiveVehicleId: (id: number) => void;
}

const VehicleContext = createContext<VehicleContextValue | null>(null);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const value = useVehicles();
  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicleContext(): VehicleContextValue {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicleContext must be used within VehicleProvider');
  return ctx;
}
