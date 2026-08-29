import { useVehicleContext } from '../context/VehicleContext';

export function useActiveVehicle() {
  const { activeId, activeVehicle, loaded } = useVehicleContext();
  return { vehicleId: activeId, vehicle: activeVehicle, loaded };
}
