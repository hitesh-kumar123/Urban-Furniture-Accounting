import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SEARCH_ITEMS = [
  // Core Modules
  { id: 'nav-dash', title: 'Executive Overview Dashboard', category: 'Navigation', icon: 'dashboard', path: '/' },
  { id: 'nav-emp', title: 'Employee Directory & Hub', category: 'Navigation', icon: 'badge', path: '/employees' },
  { id: 'nav-contracts', title: 'Contract Registry & Terms', category: 'Navigation', icon: 'description', path: '/contracts' },
  { id: 'nav-sched', title: 'Working Schedules & Shifts', category: 'Navigation', icon: 'calendar_month', path: '/schedules' },
  { id: 'nav-att', title: 'Time & Attendance Governance', category: 'Navigation', icon: 'fingerprint', path: '/attendance' },
  { id: 'nav-leave', title: 'Time Off & Leave Central', category: 'Navigation', icon: 'flight_takeoff', path: '/time-off' },
  { id: 'nav-payrun', title: 'Payrun Processing Engine', category: 'Navigation', icon: 'receipt_long', path: '/payruns' },
  { id: 'nav-payslips', title: 'Digital Payslip Vault', category: 'Navigation', icon: 'payments', path: '/payslips' },
  { id: 'nav-struct', title: 'Salary Structures', category: 'Navigation', icon: 'account_tree', path: '/salary-structures' },
  { id: 'nav-rules', title: 'Salary Rules & Formula Engine', category: 'Navigation', icon: 'functions', path: '/salary-rules' },
  { id: 'nav-reports', title: 'Workforce Reports & Intelligence', category: 'Navigation', icon: 'analytics', path: '/reports' },
  { id: 'nav-settings', title: 'System & RBAC Settings', category: 'Navigation', icon: 'settings', path: '/settings' },

  // Quick Operational Actions
  { id: 'act-payrun', title: 'Initialize New Payrun Batch', category: 'Quick Action', icon: 'add_circle', path: '/payruns' },
  { id: 'act-leave', title: 'Submit Leave Request', category: 'Quick Action', icon: 'event_available', path: '/time-off' },
  { id: 'act-punch', title: 'Clock In / Clock Out Shift', category: 'Quick Action', icon: 'login', path: '/attendance' },
  { id: 'act-export', title: 'Export Payroll Ledger (CSV)', category: 'Quick Action', icon: 'file_download', path: '/reports' },

  // Key Staff Demo Profiles
  { id: 'emp-alex', title: 'Alex Turner — Senior Staff Engineer', category: 'Employees', icon: 'person', path: '/employees' },
  { id: 'emp-sarah', title: 'Sarah Jenkins — Principal Product Lead', category: 'Employees', icon: 'person', path: '/employees' },
  { id: 'emp-michael', title: 'Michael Chang — Growth Marketing Lead', category: 'Employees', icon: 'person', path: '/employees' },
  { id: 'emp-emily', title: 'Emily Davis — Lead UI/UX Designer', category: 'Employees', icon: 'person', path: '/employees' }
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

  // Keyboard navigation inside modal
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <span className="material-symbols-outlined text-primary text-2xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page, employee, or action..."
            className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 font-medium text-base focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold text-slate-400 bg-slate-200/80 rounded-md border border-slate-300/60 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100/60">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
              <p className="text-sm font-semibold text-slate-600">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for Payruns, Attendance, or Employee names.</p>
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
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20 scale-[1.01]'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-primary border border-indigo-100/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {item.category} • Press Enter to jump
                      </span>
                    </div>
                  </div>

                  <span
                    className={`material-symbols-outlined text-lg transition-transform ${
                      isSelected ? 'text-white translate-x-1' : 'text-slate-300'
                    }`}
                  >
                    arrow_forward
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-sans font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">↑</kbd> <kbd className="font-sans font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">↓</kbd></span>
            <span>Select: <kbd className="font-sans font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">↵</kbd></span>
          </div>
          <span>Staffora Spotlight</span>
        </div>
      </div>
    </div>
  );
};
