import { useState, useEffect } from 'react';
import './style/modal_tkp.css'; // Стили для модального окна

export const ModalTkp = ({ isOpen, onClose, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`modal-backdrop ${isVisible ? 'modal-visible' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="modal-container">
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};