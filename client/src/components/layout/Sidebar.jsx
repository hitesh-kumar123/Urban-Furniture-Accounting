import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, login } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const navigate = useNavigate();

  const handleSwitchRole = async (demoUser) => {
    setShowRoleMenu(false);
    await login(demoUser.email, demoUser.password);
    navigate('/');
  };

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

        {/* Persona Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full flex items-center justify-between bg-[#111114] hover:bg-[#17171B] border border-white/10 px-2.5 py-1.5 rounded transition-colors text-left"
            title="Switch demo persona role"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B3D] shrink-0"></span>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#6F6C69]">
                    Role
                  </span>
                  <span className="text-xs font-semibold text-[#F5F2EA] truncate leading-tight">
                    {user?.role || 'Guest'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <span className="material-symbols-outlined text-[#6F6C69] text-xs">
                unfold_more
              </span>
            )}
          </button>

          {/* Quick Role Switcher Dropdown */}
          {showRoleMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#17171B] border border-white/10 rounded shadow-2xl p-1.5 z-50 flex flex-col gap-0.5">
              <div className="px-2 py-1 text-[9px] font-mono text-[#6F6C69] uppercase tracking-wider">
                Switch Role Persona
              </div>
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleSwitchRole(demo)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    user?.role === demo.role
                      ? 'bg-[#1E1E24] text-[#FF8A65] font-semibold'
                      : 'hover:bg-[#1E1E24] text-[#A6A3A0]'
                  }`}
                >
                  <span className="truncate">{demo.label}</span>
                  {user?.role === demo.role && (
                    <span className="material-symbols-outlined text-xs text-[#FF6B3D]">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
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
