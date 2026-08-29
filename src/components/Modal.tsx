import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export default function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
