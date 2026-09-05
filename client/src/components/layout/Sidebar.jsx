import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();

  const navGroups = [
    {
      label: 'WORKSPACE',
      items: [
        { name: 'Overview', path: '/', icon: 'grid_view', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'], shortcut: '⌘1' }
      ]
    },
    {
      label: 'PEOPLE',
      items: [
        { name: 'Employees', path: '/employees', icon: 'person', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'], shortcut: '⌘2' },
        { name: 'Contracts', path: '/contracts', icon: 'contract', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Schedules', path: '/schedules', icon: 'calendar_month', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Attendance', path: '/attendance', icon: 'schedule', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Time Off', path: '/time-off', icon: 'event_busy', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    },
    {
      label: 'PAYROLL',
      items: [
        { name: 'Payruns', path: '/payruns', icon: 'account_balance_wallet', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'], shortcut: '⌘P' },
        { name: 'Payslips', path: '/payslips', icon: 'receipt', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Salary Structures', path: '/salary-structures', icon: 'schema', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Salary Rules', path: '/salary-rules', icon: 'code', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] }
      ]
    },
    {
      label: 'INSIGHTS',
      items: [
        { name: 'Reports', path: '/reports', icon: 'query_stats', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { name: 'Settings', path: '/settings', icon: 'tune', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0B0B0D] border-r border-white/10 z-50 flex flex-col justify-between overflow-y-auto transition-all duration-150 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="p-3 flex flex-col gap-4">
        {/* Brand Logo Header */}
        <Link to="/" className="flex items-center gap-2.5 px-2 py-1.5 group">
          <div className="w-7 h-7 rounded bg-[#FF6B3D] flex items-center justify-center text-[#0B0B0D] font-black text-sm shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-[#F5F2EA] tracking-wider uppercase leading-none font-display">
                Staffora
              </span>
              <span className="text-[9px] font-mono text-[#6F6C69] tracking-widest uppercase mt-0.5">
                Workforce OS
              </span>
            </div>
          )}
        </Link>

        {/* Authenticated User Status */}
        <div className="bg-[#111114] border border-white/10 px-2.5 py-1.5 rounded text-left">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A] shrink-0"></span>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#6F6C69]">
                  Authenticated Role
                </span>
                <span className="text-xs font-semibold text-[#F5F2EA] truncate leading-tight">
                  {user?.role || 'Guest'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-3">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              user?.role === 'Admin' || item.roles.includes(user?.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-0.5">
                {!collapsed && (
                  <p className="px-2.5 text-[9px] font-mono font-semibold uppercase tracking-widest text-[#6F6C69] mb-1">
                    {group.label}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-xs ${
                          isActive
                            ? 'bg-[#17171B] text-[#F5F2EA] font-semibold border-l-2 border-[#FF6B3D]'
                            : 'text-[#A6A3A0] hover:text-[#F5F2EA] hover:bg-[#111114]'
                        }`
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="material-symbols-outlined text-[16px] text-[#A6A3A0] shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      {!collapsed && item.shortcut && (
                        <span className="font-mono text-[9px] text-[#6F6C69]">
                          {item.shortcut}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Collapse Button */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full px-2 py-1.5 rounded text-[#6F6C69] hover:text-[#F5F2EA] hover:bg-[#111114] transition-colors text-xs"
        >
          {!collapsed && <span className="text-[11px] font-mono">Collapse</span>}
          <span className="material-symbols-outlined text-sm">
            {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>
    </aside>
  );
};
