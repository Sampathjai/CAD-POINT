import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function MobileBottomSheet({ isOpen, onClose, title, children, maxHeight = '85vh' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-sheet-backdrop" onClick={onClose}>
      <div 
        className="mobile-sheet-container" 
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-sheet-handle-bar">
          <div className="mobile-sheet-handle"></div>
        </div>
        
        {title && (
          <div className="mobile-sheet-header">
            <h3>{title}</h3>
            <button className="mobile-sheet-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="mobile-sheet-body">
          {children}
        </div>
      </div>
    </div>
  );
}
