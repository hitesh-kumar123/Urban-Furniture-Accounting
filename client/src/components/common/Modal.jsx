import React, { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#1C1B19]/45 backdrop-blur-xs">
      <div
        className={`w-full ${maxWidth} bg-white rounded-lg border border-[#E7E2D9] shadow-xl overflow-hidden`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#FAF9F6] border-b border-[#E7E2D9] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1C1B19] font-heading">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#6B665C] hover:bg-[#F0ECE1] hover:text-[#1C1B19] transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[80vh] overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  );
};
