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
      label: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/', icon: 'dashboard', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    },
    {
      label: 'CORE HR & SHIFTS',
      items: [
        { name: 'Employees', path: '/employees', icon: 'badge', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Contracts', path: '/contracts', icon: 'description', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Shift Schedules', path: '/schedules', icon: 'calendar_month', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Attendance', path: '/attendance', icon: 'fingerprint', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Time Off & Leaves', path: '/time-off', icon: 'flight_takeoff', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    },
    {
      label: 'PAYROLL ENGINE',
      items: [
        { name: 'Payrun Batches', path: '/payruns', icon: 'receipt_long', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Payslips Vault', path: '/payslips', icon: 'payments', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Salary Structures', path: '/salary-structures', icon: 'account_tree', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Salary Rules', path: '/salary-rules', icon: 'functions', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] }
      ]
    },
    {
      label: 'INSIGHTS & ADMIN',
      items: [
        { name: 'Executive Reports', path: '/reports', icon: 'analytics', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Settings & RBAC', path: '/settings', icon: 'settings', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col justify-between overflow-y-auto transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Brand Logo Header */}
        <Link to="/" className="flex items-center gap-3 px-1 py-1 group">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="material-symbols-outlined text-xl">hub</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-tight">
                Staffora
              </span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                HR &amp; Payroll
              </span>
            </div>
          )}
        </Link>

        {/* Persona Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-2 rounded-lg transition-colors"
            title="Switch demo persona role"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              {!collapsed && (
                <div className="flex flex-col text-left truncate">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                    Active Persona
                  </span>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {user?.role || 'Guest User'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <span className="material-symbols-outlined text-slate-400 text-sm">
                unfold_more
              </span>
            )}
          </button>

          {/* Quick Role Switcher Dropdown */}
          {showRoleMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50 flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role Persona
              </div>
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleSwitchRole(demo)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                    user?.role === demo.role
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{demo.label}</span>
                  {user?.role === demo.role && (
                    <span className="material-symbols-outlined text-sm text-indigo-600">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-4">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              user?.role === 'Admin' || item.roles.includes(user?.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-xs ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="material-symbols-outlined text-[18px] shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </div>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Collapse Button */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-medium"
        >
          {!collapsed && <span>Collapse Sidebar</span>}
          <span className="material-symbols-outlined text-base">
            {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>
    </aside>
  );
};
