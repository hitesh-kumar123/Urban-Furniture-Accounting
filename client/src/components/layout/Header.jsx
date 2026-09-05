import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';

export const Header = ({ collapsed }) => {
  const { user, login, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Global Cmd+K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derive readable breadcrumb hierarchy
  const getBreadcrumbInfo = () => {
    const path = location.pathname.split('/')[1] || '';
    const map = {
      '': { section: 'People Operations', label: 'Overview Dashboard', path: '/' },
      dashboard: { section: 'People Operations', label: 'Overview Dashboard', path: '/' },
      employees: { section: 'People Operations', label: 'Talent & Employee Hub', path: '/employees' },
      contracts: { section: 'People Operations', label: 'Contract Registry', path: '/contracts' },
      schedules: { section: 'Operations Setup', label: 'Working Schedules & Shifts', path: '/schedules' },
      attendance: { section: 'People Operations', label: 'Attendance & Clock Governance', path: '/attendance' },
      'time-off': { section: 'People Operations', label: 'Time Off & Leave Central', path: '/time-off' },
      payruns: { section: 'Payroll Engine', label: 'Payrun Batches & Engine', path: '/payruns' },
      payslips: { section: 'Payroll Engine', label: 'Digital Payslip Vault', path: '/payslips' },
      'salary-structures': { section: 'Payroll Engine', label: 'Salary Structures', path: '/salary-structures' },
      'salary-rules': { section: 'Payroll Engine', label: 'Salary Rules & Formula Engine', path: '/salary-rules' },
      reports: { section: 'Workforce Insights', label: 'Executive Reports & Intelligence', path: '/reports' },
      settings: { section: 'System Administration', label: 'Configuration & RBAC', path: '/settings' }
    };
    return map[path] || { section: 'People Operations', label: 'Overview Dashboard', path: '/' };
  };

  const breadcrumb = getBreadcrumbInfo();

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] z-40 flex items-center justify-between px-6 transition-all duration-300 ${
          collapsed ? 'left-20' : 'left-64'
        }`}
      >
        {/* Left Clickable Interactive Breadcrumbs & Spotlight Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold hidden md:flex shrink-0">
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-indigo-50/80 transition-all flex items-center justify-center"
              title="Return to Home Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
              {breadcrumb.section}
            </span>
            <span className="text-slate-300">/</span>
            <Link
              to={breadcrumb.path}
              className="px-2 py-1 rounded-md text-primary font-bold bg-indigo-50/70 border border-indigo-100/60 hover:bg-indigo-100/80 transition-all truncate max-w-[200px]"
            >
              {breadcrumb.label}
            </Link>
          </nav>

          {/* Interactive Spotlight Search Trigger */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative flex-1 cursor-pointer group"
          >
            <div className="w-full flex items-center justify-between pl-3 pr-2 py-1.5 bg-slate-50 group-hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-slate-400 text-xs font-medium shadow-inner transition-all group-hover:border-primary/40 group-hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-[18px] transition-colors">
                  search
                </span>
                <span className="truncate">Search staff, payruns, salary rules, leaves...</span>
              </div>
              <kbd className="font-mono text-[10px] font-bold bg-white text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded shadow-xs group-hover:border-primary/30">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* New Payrun Button for authorized roles */}
          {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
            <button
              onClick={() => navigate('/payruns')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-white px-3.5 py-1.5 rounded-xl font-bold text-xs hover:opacity-95 transition-all shadow-md shadow-primary/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span className="hidden sm:inline">New Payrun</span>
            </button>
          )}

          {/* Notification Center Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl border transition-all ${
                showNotifications
                  ? 'bg-indigo-50 border-primary/40 text-primary'
                  : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-600'
              }`}
              title="Operational Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <NotificationDrawer
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Reports quick jump */}
          <button
            onClick={() => navigate('/reports')}
            className="p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-primary transition-all hidden sm:flex"
            title="Workforce Intelligence & Reports"
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </button>

          {/* Profile Avatar & Interactive Role Dropdown */}
          <div className="relative pl-3 border-l border-slate-200/80">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold text-xs flex items-center justify-center ring-2 ring-primary/20 shadow-sm shrink-0">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-bold text-xs text-slate-800 leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider leading-tight">
                  {user?.role || 'Staff'}
                </span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">
                {showProfileMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-2xl p-2.5 z-50 animate-fadeIn flex flex-col gap-2">
                <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[9px] font-extrabold uppercase tracking-wider">
                      {user?.role}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
                    </span>
                  </div>
                </div>

                {/* 1-Click Role Switcher inside dropdown */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
                    Fast Demo Role Switch:
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {DEMO_USERS.map((demo) => (
                      <button
                        key={demo.role}
                        onClick={async () => {
                          await login(demo.email, demo.password);
                          setShowProfileMenu(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                          user?.role === demo.role
                            ? 'bg-indigo-50 text-primary font-bold'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="text-[11px] truncate">{demo.role}</span>
                        {user?.role === demo.role && (
                          <span className="material-symbols-outlined text-xs text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-[11px] font-medium"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    System Settings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-[11px] font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Spotlight Search Modal Component */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
};
