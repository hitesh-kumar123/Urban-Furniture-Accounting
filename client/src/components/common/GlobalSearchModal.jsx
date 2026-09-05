import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SEARCH_ITEMS = [
  // Core Modules
  { id: 'nav-dash', title: 'Overview Dashboard', category: 'Navigation', icon: 'dashboard', path: '/' },
  { id: 'nav-emp', title: 'Employee Directory', category: 'Navigation', icon: 'badge', path: '/employees' },
  { id: 'nav-contracts', title: 'Contract Registry', category: 'Navigation', icon: 'description', path: '/contracts' },
  { id: 'nav-sched', title: 'Shift Schedules', category: 'Navigation', icon: 'calendar_month', path: '/schedules' },
  { id: 'nav-att', title: 'Attendance & Clock Desk', category: 'Navigation', icon: 'fingerprint', path: '/attendance' },
  { id: 'nav-leave', title: 'Time Off & Leaves', category: 'Navigation', icon: 'flight_takeoff', path: '/time-off' },
  { id: 'nav-payrun', title: 'Payrun Batches & Engine', category: 'Navigation', icon: 'receipt_long', path: '/payruns' },
  { id: 'nav-payslips', title: 'Payslips Vault', category: 'Navigation', icon: 'payments', path: '/payslips' },
  { id: 'nav-struct', title: 'Salary Structures', category: 'Navigation', icon: 'account_tree', path: '/salary-structures' },
  { id: 'nav-rules', title: 'Salary Rules & Formulas', category: 'Navigation', icon: 'functions', path: '/salary-rules' },
  { id: 'nav-reports', title: 'Executive Reports', category: 'Navigation', icon: 'analytics', path: '/reports' },
  { id: 'nav-settings', title: 'Settings & RBAC', category: 'Navigation', icon: 'settings', path: '/settings' },

  // Quick Operational Actions
  { id: 'act-payrun', title: 'Create New Payrun Batch', category: 'Actions', icon: 'play_arrow', path: '/payruns' },
  { id: 'act-leave', title: 'Submit Leave Request', category: 'Actions', icon: 'event_available', path: '/time-off' },
  { id: 'act-punch', title: 'Clock In / Out Shift', category: 'Actions', icon: 'login', path: '/attendance' },
  { id: 'act-export', title: 'Export Payroll Ledger (CSV)', category: 'Actions', icon: 'file_download', path: '/reports' }
];

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl bg-[#17171B] rounded-lg shadow-2xl border border-white/10 overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111114]">
          <span className="material-symbols-outlined text-[#FF6B3D] text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to workspace..."
            className="flex-1 bg-transparent text-[#F5F2EA] placeholder:text-[#6F6C69] font-medium text-sm focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-[#6F6C69] border border-white/10 bg-[#17171B] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#6F6C69] text-xs">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#1E1E24] text-[#F5F2EA]' : 'text-[#A6A3A0] hover:bg-[#1E1E24]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-[#FF6B3D]' : 'text-[#6F6C69]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs font-medium">{item.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-[#6F6C69]">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#111114] border-t border-white/10 flex items-center justify-between text-[11px] text-[#6F6C69]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span className="font-mono">Staffora OS</span>
        </div>
      </div>
    </div>
  );
};
