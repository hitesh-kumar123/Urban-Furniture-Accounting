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

  const getBreadcrumbInfo = () => {
    const path = location.pathname.split('/')[1] || '';
    const map = {
      '': { section: 'Workspace', label: 'Overview', path: '/' },
      dashboard: { section: 'Workspace', label: 'Overview', path: '/' },
      employees: { section: 'People', label: 'Employees', path: '/employees' },
      contracts: { section: 'People', label: 'Contracts', path: '/contracts' },
      schedules: { section: 'People', label: 'Schedules', path: '/schedules' },
      attendance: { section: 'People', label: 'Attendance', path: '/attendance' },
      'time-off': { section: 'People', label: 'Time Off', path: '/time-off' },
      payruns: { section: 'Payroll', label: 'Payruns', path: '/payruns' },
      payslips: { section: 'Payroll', label: 'Payslips', path: '/payslips' },
      'salary-structures': { section: 'Payroll', label: 'Salary Structures', path: '/salary-structures' },
      'salary-rules': { section: 'Payroll', label: 'Salary Rules', path: '/salary-rules' },
      reports: { section: 'Insights', label: 'Reports', path: '/reports' },
      settings: { section: 'System', label: 'Settings', path: '/settings' }
    };
    return map[path] || { section: 'Workspace', label: 'Overview', path: '/' };
  };

  const breadcrumb = getBreadcrumbInfo();

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-12 bg-[#0B0B0D] border-b border-white/10 z-40 flex items-center justify-between px-5 transition-all duration-150 ${
          collapsed ? 'left-16' : 'left-60'
        }`}
      >
        {/* Left Interactive Breadcrumbs & Command Palette Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-mono hidden md:flex shrink-0">
            <Link
              to="/"
              className="text-[#6F6C69] hover:text-[#F5F2EA] transition-colors"
              title="Overview"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </Link>
            <span className="text-[#6F6C69]">/</span>
            <span className="text-[#6F6C69] text-[11px] uppercase tracking-wider">
              {breadcrumb.section}
            </span>
            <span className="text-[#6F6C69]">/</span>
            <Link
              to={breadcrumb.path}
              className="text-[#F5F2EA] font-semibold text-xs hover:text-[#FF8A65] transition-colors truncate max-w-[180px]"
            >
              {breadcrumb.label}
            </Link>
          </nav>

          {/* Command Search Trigger */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative flex-1 cursor-pointer"
          >
            <div className="w-full flex items-center justify-between pl-2.5 pr-2 py-1 bg-[#111114] hover:bg-[#17171B] border border-white/10 rounded text-[#6F6C69] hover:text-[#A6A3A0] text-xs font-medium transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">search</span>
                <span className="truncate">Search commands, pages...</span>
              </div>
              <kbd className="font-mono text-[9px] text-[#6F6C69] border border-white/10 bg-[#17171B] px-1 py-0.2 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Action Trigger */}
          {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
            <button
              onClick={() => navigate('/payruns')}
              className="flex items-center gap-1 bg-[#FF6B3D] hover:bg-[#FF8A65] text-[#0B0B0D] px-2.5 py-1 rounded font-semibold text-xs transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              <span className="hidden sm:inline">Run Payrun</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-1.5 rounded border transition-colors ${
                showNotifications
                  ? 'bg-[#1E1E24] border-white/20 text-[#FF8A65]'
                  : 'bg-[#111114] hover:bg-[#17171B] border-white/10 text-[#A6A3A0]'
              }`}
              title="Notifications"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF6B3D] rounded-full"></span>
            </button>

            <NotificationDrawer
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Profile Dropdown */}
          <div className="relative pl-2 border-l border-white/10">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded hover:bg-[#111114] transition-colors"
            >
              <div className="w-6 h-6 rounded bg-[#1E1E24] border border-white/10 text-[#FF8A65] font-bold text-[11px] flex items-center justify-center shrink-0 font-mono">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="material-symbols-outlined text-[#6F6C69] text-sm">
                {showProfileMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#17171B] border border-white/10 rounded shadow-2xl p-2 z-50 flex flex-col gap-1.5">
                <div className="px-2 py-1.5 bg-[#111114] rounded border border-white/5">
                  <p className="text-xs font-bold text-[#F5F2EA]">{user?.name}</p>
                  <p className="text-[10px] text-[#6F6C69] truncate font-mono">{user?.email}</p>
                  <div className="mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-[#FF6B3D]/10 text-[#FF8A65] border border-[#FF6B3D]/25 text-[9px] font-mono font-semibold uppercase">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-[#6F6C69] uppercase tracking-wider px-2 block">
                    Fast Demo Role Switch:
                  </span>
                  {DEMO_USERS.map((demo) => (
                    <button
                      key={demo.role}
                      onClick={async () => {
                        await login(demo.email, demo.password);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                        user?.role === demo.role
                          ? 'bg-[#1E1E24] text-[#FF8A65] font-semibold'
                          : 'hover:bg-[#1E1E24] text-[#A6A3A0]'
                      }`}
                    >
                      <span className="truncate">{demo.role}</span>
                      {user?.role === demo.role && (
                        <span className="material-symbols-outlined text-xs text-[#FF6B3D]">check</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-white/10 flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1 text-[#A6A3A0] hover:text-[#F5F2EA] hover:bg-[#111114] rounded text-xs"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    Settings &amp; RBAC
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 px-2 py-1 text-[#FF5C5C] hover:bg-[#FF5C5C]/10 rounded text-xs font-semibold"
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

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
};
