import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, login } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const navigate = useNavigate();

  const handleSwitchRole = async (demoUser) => {
    setShowRoleMenu(false);
    await login(demoUser.email, demoUser.password);
    navigate('/dashboard');
  };

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: 'auto_awesome', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    },
    {
      label: 'People',
      items: [
        { name: 'Employees', path: '/employees', icon: 'group', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Contracts', path: '/contracts', icon: 'description', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Attendance', path: '/attendance', icon: 'schedule', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Time Off', path: '/time-off', icon: 'calendar_today', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    },
    {
      label: 'Payroll',
      items: [
        { name: 'Payruns', path: '/payruns', icon: 'payments', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Payslips', path: '/payslips', icon: 'receipt_long', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] },
        { name: 'Salary Structures', path: '/salary-structures', icon: 'account_tree', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Salary Rules', path: '/salary-rules', icon: 'tune', roles: ['Admin', 'HR Payroll User', 'HR Payroll Manager'] }
      ]
    },
    {
      label: 'Insights & Config',
      items: [
        { name: 'Reports', path: '/reports', icon: 'bar_chart', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'] },
        { name: 'Settings', path: '/settings', icon: 'settings', roles: ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Employee'] }
      ]
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-space-md flex flex-col gap-space-md">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-lg">hub</span>
            </div>
            {!collapsed && (
              <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight truncate">
                Staffora
              </span>
            )}
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full flex items-center justify-between bg-surface-container-low px-space-sm py-space-2xs rounded-xl hover:bg-surface-container transition-colors"
            title="Switch demo role persona"
          >
            <div className="flex items-center gap-space-xs truncate">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
              {!collapsed && (
                <>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Role
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    {user?.role || 'Guest'}
                  </span>
                </>
              )}
            </div>
            {!collapsed && (
              <span className="material-symbols-outlined text-on-surface-variant text-base">
                unfold_more
              </span>
            )}
          </button>

          {/* Quick Role Switcher Dropdown */}
          {showRoleMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl p-2 z-50 flex flex-col gap-1">
              <div className="px-2 py-1 text-xs font-semibold text-outline uppercase tracking-wider">
                Fast Switch Persona
              </div>
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleSwitchRole(demo)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    user?.role === demo.role
                      ? 'bg-primary-container text-white font-bold'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <span>{demo.label}</span>
                  {user?.role === demo.role && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-space-xs">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              user?.role === 'Admin' || item.roles.includes(user?.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="px-space-xs pt-space-xs">
                {!collapsed && (
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-outline mb-space-2xs">
                    {group.label}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-space-xs px-space-sm py-space-xs rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary-container text-on-primary font-bold shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]'
                            : 'font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                        }`
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <span className="material-symbols-outlined text-lg shrink-0">
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Status & Collapse Button */}
      <div className="p-space-md flex flex-col gap-space-sm bg-surface-container-lowest">
        {!collapsed && (
          <div className="flex items-center justify-between px-space-xs py-space-2xs bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-space-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface font-medium">
                Payroll Engine: Online
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-outline">v2.4</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full px-space-xs py-space-2xs text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {!collapsed && <span className="font-label-md text-label-md">Collapse Sidebar</span>}
          <span className="material-symbols-outlined text-base">
            {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>
    </aside>
  );
};
