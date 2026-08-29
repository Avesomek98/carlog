import { useState } from 'react';
import { Car, Plus } from 'lucide-react';
import AddVehicleForm from './AddVehicleForm';
import Modal from './Modal';

export default function EmptyGarage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="stack">
      <section className="card empty-garage">
        <div className="empty-garage-icon">
          <Car size={26} />
        </div>
        <h2 className="empty-garage-title">Brak pojazdów</h2>
        <p className="muted small">Dodaj swoje pierwsze auto, żeby zacząć planować serwis, terminy prawne i budżet.</p>
        <button className="btn" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Dodaj pojazd
        </button>
      </section>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <AddVehicleForm onDone={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}
