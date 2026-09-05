import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';

export const Header = ({ collapsed }) => {
  const { user, login, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        className={`fixed top-0 right-0 h-12 bg-[#F7F5F1] border-b border-[#E7E2D9] z-40 flex items-center justify-between px-5 transition-all duration-150 ${
          collapsed ? 'left-16' : 'left-60'
        }`}
      >
        {/* Left Interactive Breadcrumbs & Command Palette Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs hidden md:flex shrink-0">
            <Link
              to="/"
              className="text-[#6B665C] hover:text-[#1C1B19] transition-colors"
              title="Overview"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </Link>
            <span className="text-[#918C82]">/</span>
            <span className="text-[#6B665C] text-xs">
              {breadcrumb.section}
            </span>
            <span className="text-[#918C82]">/</span>
            <Link
              to={breadcrumb.path}
              className="text-[#1C1B19] font-medium text-xs hover:text-[#0F5C4A] transition-colors truncate max-w-[180px]"
            >
              {breadcrumb.label}
            </Link>
          </nav>

          {/* Command Search Trigger */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative flex-1 cursor-pointer"
          >
            <div className="w-full flex items-center justify-between pl-2.5 pr-2 py-1 bg-white hover:bg-[#F5F2EB] border border-[#E7E2D9] rounded text-[#6B665C] hover:text-[#1C1B19] text-xs font-medium transition-colors shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#918C82]">search</span>
                <span className="truncate">Search commands, staff, pages...</span>
              </div>
              <kbd className="font-mono text-[9px] text-[#6B665C] border border-[#E7E2D9] bg-[#F7F5F1] px-1 py-0.2 rounded">
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
              className="flex items-center gap-1 bg-[#0F5C4A] hover:bg-[#0B4739] text-white px-2.5 py-1 rounded font-medium text-xs transition-colors shadow-xs"
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
                  ? 'bg-white border-[#0F5C4A] text-[#0F5C4A]'
                  : 'bg-white hover:bg-[#F5F2EB] border-[#E7E2D9] text-[#6B665C]'
              }`}
              title="Notifications"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#B5482E] rounded-full"></span>
              )}
            </button>

            <NotificationDrawer
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onUnreadCountChange={setUnreadCount}
            />
          </div>

          {/* Profile Dropdown */}
          <div className="relative pl-2 border-l border-[#E7E2D9]">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded hover:bg-[#F0ECE1] transition-colors"
            >
              <div className="w-6 h-6 rounded bg-[#E8F4F1] border border-[#C5E4DC] text-[#0F5C4A] font-semibold text-[11px] flex items-center justify-center shrink-0 font-mono">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <span className="material-symbols-outlined text-[#6B665C] text-sm">
                {showProfileMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#E7E2D9] rounded shadow-lg p-2 z-50 flex flex-col gap-1.5">
                <div className="px-2.5 py-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
                  <p className="text-xs font-semibold text-[#1C1B19]">{user?.name}</p>
                  <p className="text-[10px] text-[#6B665C] truncate font-mono mt-0.5">{user?.email}</p>
                  <div className="mt-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#E8F4F1] text-[#0F5C4A] border border-[#C5E4DC] text-[9px] font-mono font-medium">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-[#E7E2D9] flex flex-col gap-0.5">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1 text-[#6B665C] hover:text-[#1C1B19] hover:bg-[#F5F2EB] rounded text-xs"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    Settings &amp; Access
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 px-2 py-1 text-[#B5482E] hover:bg-[#FDF1EE] rounded text-xs font-medium"
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
