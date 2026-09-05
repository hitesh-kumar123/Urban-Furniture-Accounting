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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80">
      <div
        className={`w-full ${maxWidth} bg-[#17171B] rounded-lg border border-white/10 shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#111114] border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F5F2EA]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#6F6C69] hover:bg-[#1E1E24] hover:text-[#F5F2EA] transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
