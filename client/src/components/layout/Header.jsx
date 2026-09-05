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
      '': { section: 'Overview', label: 'Dashboard', path: '/' },
      dashboard: { section: 'Overview', label: 'Dashboard', path: '/' },
      employees: { section: 'Core HR', label: 'Employees', path: '/employees' },
      contracts: { section: 'Core HR', label: 'Contracts', path: '/contracts' },
      schedules: { section: 'Core HR', label: 'Shift Schedules', path: '/schedules' },
      attendance: { section: 'Core HR', label: 'Attendance', path: '/attendance' },
      'time-off': { section: 'Core HR', label: 'Time Off & Leaves', path: '/time-off' },
      payruns: { section: 'Payroll Engine', label: 'Payrun Batches', path: '/payruns' },
      payslips: { section: 'Payroll Engine', label: 'Payslips Vault', path: '/payslips' },
      'salary-structures': { section: 'Payroll Engine', label: 'Salary Structures', path: '/salary-structures' },
      'salary-rules': { section: 'Payroll Engine', label: 'Salary Rules', path: '/salary-rules' },
      reports: { section: 'Insights', label: 'Executive Reports', path: '/reports' },
      settings: { section: 'Admin', label: 'Settings & RBAC', path: '/settings' }
    };
    return map[path] || { section: 'Overview', label: 'Dashboard', path: '/' };
  };

  const breadcrumb = getBreadcrumbInfo();

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-6 transition-all duration-200 ${
          collapsed ? 'left-16' : 'left-64'
        }`}
      >
        {/* Left Clickable Interactive Breadcrumbs & Spotlight Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-medium hidden md:flex shrink-0">
            <Link
              to="/"
              className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center"
              title="Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 text-xs">
              {breadcrumb.section}
            </span>
            <span className="text-slate-300">/</span>
            <Link
              to={breadcrumb.path}
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors truncate max-w-[200px]"
            >
              {breadcrumb.label}
            </Link>
          </nav>

          {/* Interactive Spotlight Search Trigger */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative flex-1 cursor-pointer group"
          >
            <div className="w-full flex items-center justify-between pl-3 pr-2 py-1.5 bg-slate-50 group-hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-400 text-xs font-medium transition-colors group-hover:border-slate-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-indigo-600 text-[18px] transition-colors">
                  search
                </span>
                <span className="truncate">Search employees, payruns, rules...</span>
              </div>
              <kbd className="font-mono text-[10px] font-semibold bg-white text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* New Payrun Button for authorized roles */}
          {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
            <button
              onClick={() => navigate('/payruns')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span className="hidden sm:inline">New Payrun</span>
            </button>
          )}

          {/* Notification Center Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg border transition-colors ${
                showNotifications
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <NotificationDrawer
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Profile Avatar & Interactive Role Dropdown */}
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-semibold text-xs text-slate-800 leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-tight">
                  {user?.role || 'Staff'}
                </span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">
                {showProfileMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 flex flex-col gap-2">
                <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold">
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* 1-Click Role Switcher inside dropdown */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 block">
                    Fast Demo Role Switch:
                  </span>
                  <div className="grid grid-cols-1 gap-0.5">
                    {DEMO_USERS.map((demo) => (
                      <button
                        key={demo.role}
                        onClick={async () => {
                          await login(demo.email, demo.password);
                          setShowProfileMenu(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                          user?.role === demo.role
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="text-xs truncate">{demo.role}</span>
                        {user?.role === demo.role && (
                          <span className="material-symbols-outlined text-sm text-indigo-600">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-xs font-medium"
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    System Settings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
};
