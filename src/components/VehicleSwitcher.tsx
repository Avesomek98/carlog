import { useEffect, useRef, useState } from 'react';
import { useVehicleContext } from '../context/VehicleContext';
import { Car as IconCar, Check as IconCheck, ChevronDown as IconChevronDown, Plus as IconPlus } from 'lucide-react';
import AddVehicleForm from './AddVehicleForm';
import Modal from './Modal';

export default function VehicleSwitcher() {
  const { vehicles, activeId, activeVehicle, setActiveVehicleId } = useVehicleContext();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!activeVehicle) {
    return (
      <div className="vehicle-switcher">
        <button className="vehicle-switcher-trigger" onClick={() => setShowAdd(true)}>
          <IconPlus size={16} />
          <span className="vehicle-switcher-label">Dodaj pojazd</span>
        </button>
        {showAdd && (
          <Modal onClose={() => setShowAdd(false)}>
            <AddVehicleForm onDone={() => setShowAdd(false)} />
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="vehicle-switcher" ref={rootRef}>
      <button className="vehicle-switcher-trigger" onClick={() => setOpen((v) => !v)}>
        <IconCar size={18} />
        <span className="vehicle-switcher-label">{activeVehicle.make} {activeVehicle.model}</span>
        <IconChevronDown size={15} />
      </button>

      {open && (
        <div className="vehicle-switcher-menu">
          {vehicles.map((v) => (
            <button
              key={v.id}
              className="vehicle-switcher-item"
              onClick={() => {
                setActiveVehicleId(v.id!);
                setOpen(false);
              }}
            >
              <span>{v.make} {v.model} <span className="muted small">{v.year}</span></span>
              {v.id === activeId && <IconCheck size={14} />}
            </button>
          ))}
          <div className="vehicle-switcher-divider" />
          <button
            className="vehicle-switcher-item vehicle-switcher-add"
            onClick={() => {
              setShowAdd(true);
              setOpen(false);
            }}
          >
            <IconPlus size={15} /> Dodaj pojazd
          </button>
        </div>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <AddVehicleForm onDone={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}
