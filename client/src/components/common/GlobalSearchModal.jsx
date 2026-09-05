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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm font-body">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E7E2D9] overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E7E2D9] bg-[#FAF9F6]">
          <span className="material-symbols-outlined text-[#0F5C4A] text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to workspace..."
            className="flex-1 bg-transparent text-[#1C1B19] placeholder:text-[#918C82] font-medium text-sm focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-[#6B665C] border border-[#E7E2D9] bg-white px-1.5 py-0.5 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#E7E2D9]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#6B665C] text-xs">
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#E8F4F1] text-[#0F5C4A]' : 'text-[#6B665C] hover:bg-[#FAF9F6] hover:text-[#1C1B19]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-[#0F5C4A]' : 'text-[#6B665C]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs font-medium">{item.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-[#918C82]">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#FAF9F6] border-t border-[#E7E2D9] flex items-center justify-between text-xs text-[#6B665C]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span className="font-mono text-[10px]">Staffora</span>
        </div>
      </div>
    </div>
  );
};
