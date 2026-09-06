import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const SettingsPage = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('corporate'); // 'corporate' | 'users' | 'rbac' | 'security'
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Corporate Parameters State (Persistent)
  const [companyForm, setCompanyForm] = useState(() => {
    const saved = localStorage.getItem('staffora_org_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      companyName: 'Staffora Enterprise Solutions Pvt. Ltd.',
      taxId: 'GSTIN: 27AABCS1429B1Z5',
      panNumber: 'PAN: AABCS1429B',
      currency: 'INR (₹)',
      payCycle: 'Monthly (Last Working Day)',
      overtimeMultiplier: '1.5x Hourly Rate',
      standardWorkWeek: '40 Hours (Mon - Fri)',
      registeredAddress: 'Level 8, Cyber Tower, BKC, Mumbai, MH - 400051'
    };
  });

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await authApi.getUsers();
      if (res.success) {
        setUsersList(res.data);
      }
    } catch (err) {
      showToast('Failed to load system user directory', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveCompany = (e) => {
    e.preventDefault();
    localStorage.setItem('staffora_org_settings', JSON.stringify(companyForm));
    showToast({
      title: 'Settings Saved',
      message: 'Corporate payroll parameters & Indian statutory tax configurations updated.',
      type: 'success'
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!hasRole('Admin')) {
      showToast('Only System Administrators can modify user permissions.', 'warning');
      return;
    }
    setUpdatingUserId(userId);
    try {
      const res = await authApi.updateUserRole(userId, newRole);
      if (res.success) {
        showToast({
          title: 'Role Updated',
          message: `User role successfully assigned to ${newRole}`,
          type: 'success'
        });
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const RBAC_MODULES = [
    { module: 'Employee Profiles', admin: 'Full CRUD', hrMgr: 'Full CRUD', payrollMgr: 'View Only', payrollUser: 'View Only', emp: 'Self Profile' },
    { module: 'Employment Contracts', admin: 'Full CRUD', hrMgr: 'Full CRUD', payrollMgr: 'View Only', payrollUser: 'View Only', emp: 'View Own Contract' },
    { module: 'Attendance Desk', admin: 'Full Access', hrMgr: 'Full Approvals', payrollMgr: 'View Records', payrollUser: 'View Records', emp: 'Punch In/Out' },
    { module: 'Time-Off / Leaves', admin: 'Full Approvals', hrMgr: 'Approve & Allocate', payrollMgr: 'View Balances', payrollUser: 'View Balances', emp: 'Apply Leaves' },
    { module: 'Payruns & Calculation', admin: 'Full Access', hrMgr: 'No Access', payrollMgr: 'Confirm & Disburse', payrollUser: 'Compute Batches', emp: 'No Access' },
    { module: 'Salary Rules & CTC', admin: 'Full CRUD', hrMgr: 'No Access', payrollMgr: 'Full CRUD', payrollUser: 'View Only', emp: 'No Access' },
    { module: 'Payslip Ledger & PDF', admin: 'Full Access', hrMgr: 'View All', payrollMgr: 'Disburse & View', payrollUser: 'View All', emp: 'Download Own PDF' },
    { module: 'Executive Reports', admin: 'Export CSV & Analytics', hrMgr: 'View Analytics', payrollMgr: 'Export Ledgers', payrollUser: 'View Analytics', emp: 'No Access' }
  ];

  return (
    <div className="p-6 max-w-[1600px] w-full mx-auto flex flex-col gap-6 font-body text-[#1C1B19]">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <span className="text-xs font-semibold text-[#0F5C4A] tracking-wider uppercase">
            System Administration
          </span>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19] tracking-tight mt-0.5">
            System &amp; Security Settings
          </h1>
          <p className="text-sm text-[#6B665C] mt-1">
            Corporate entity configuration, live user access directory, and granular RBAC governance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-[#E7E2D9] text-xs shadow-sm">
          <button
            onClick={() => setActiveTab('corporate')}
            className={`px-3.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'corporate'
                ? 'bg-[#0F5C4A] text-white shadow-sm'
                : 'text-[#6B665C] hover:text-[#1C1B19] hover:bg-[#FAF9F6]'
            }`}
          >
            Corporate
          </button>
          {hasRole('Admin') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-[#0F5C4A] text-white shadow-sm'
                  : 'text-[#6B665C] hover:text-[#1C1B19] hover:bg-[#FAF9F6]'
              }`}
            >
              Users ({usersList.length || 'Directory'})
            </button>
          )}
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'rbac'
                ? 'bg-[#0F5C4A] text-white shadow-sm'
                : 'text-[#6B665C] hover:text-[#1C1B19] hover:bg-[#FAF9F6]'
            }`}
          >
            RBAC Matrix
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-[#0F5C4A] text-white shadow-sm'
                : 'text-[#6B665C] hover:text-[#1C1B19] hover:bg-[#FAF9F6]'
            }`}
          >
            Session
          </button>
        </div>
      </div>

      {/* TAB 1: CORPORATE PARAMETERS */}
      {activeTab === 'corporate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-[#E7E2D9] rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-medium text-[#1C1B19]">Corporate Payroll &amp; Statutory Parameters</h3>
                <p className="text-xs text-[#6B665C] mt-0.5">
                  Indian enterprise identification, compliance currency, and standard working shift baselines.
                </p>
              </div>
              {!hasRole('Admin') && (
                <span className="text-[11px] font-medium px-2 py-1 bg-[#FAF9F6] border border-[#E7E2D9] text-[#6B665C] rounded-md">
                  🔒 Read Only
                </span>
              )}
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">Legal Organization Name</label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    disabled={!hasRole('Admin')}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="staffora-input disabled:bg-[#FAF9F6] disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">GSTIN / Registration Number</label>
                  <input
                    type="text"
                    value={companyForm.taxId}
                    disabled={!hasRole('Admin')}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    className="staffora-input disabled:bg-[#FAF9F6] disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">Corporate PAN Identifier</label>
                  <input
                    type="text"
                    value={companyForm.panNumber}
                    disabled={!hasRole('Admin')}
                    onChange={(e) => setCompanyForm({ ...companyForm, panNumber: e.target.value })}
                    className="staffora-input font-mono disabled:bg-[#FAF9F6] disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">Base Operating Currency</label>
                  <input
                    type="text"
                    value={companyForm.currency}
                    readOnly
                    className="staffora-input bg-[#FAF9F6] text-[#0F5C4A] font-medium font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">Pay Cycle Frequency</label>
                  <input
                    type="text"
                    value={companyForm.payCycle}
                    disabled={!hasRole('Admin')}
                    onChange={(e) => setCompanyForm({ ...companyForm, payCycle: e.target.value })}
                    className="staffora-input disabled:bg-[#FAF9F6] disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">Standard Work Week Schedule</label>
                  <input
                    type="text"
                    value={companyForm.standardWorkWeek}
                    disabled={!hasRole('Admin')}
                    onChange={(e) => setCompanyForm({ ...companyForm, standardWorkWeek: e.target.value })}
                    className="staffora-input disabled:bg-[#FAF9F6] disabled:cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#1C1B19] mb-1.5">Registered Corporate Address</label>
                  <input
                    type="text"
                    value={companyForm.registeredAddress}
                    disabled={!hasRole('Admin')}
                    onChange={(e) => setCompanyForm({ ...companyForm, registeredAddress: e.target.value })}
                    className="staffora-input disabled:bg-[#FAF9F6] disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {hasRole('Admin') ? (
                <div className="pt-4 border-t border-[#E7E2D9] flex justify-end">
                  <Button variant="primary" size="sm" type="submit" icon="save">
                    Save Corporate Parameters
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF9F6] border border-[#E7E2D9] rounded-lg text-xs text-[#6B665C]">
                  ℹ️ Corporate and tax settings are managed exclusively by System Administrators.
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-4 bg-white border border-[#E7E2D9] rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <h4 className="text-sm font-heading font-medium text-[#1C1B19]">Statutory Compliance Benchmarks</h4>
            <div className="space-y-2.5 text-xs text-[#6B665C]">
              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] space-y-1">
                <span className="text-[#0F5C4A] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  EPFO &amp; PF Deduction
                </span>
                <p className="text-[11px] text-[#6B665C]">12% Statutory calculation formula applied on Basic CTC wage.</p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] space-y-1">
                <span className="text-[#0F5C4A] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                  Professional Tax (PT)
                </span>
                <p className="text-[11px] text-[#6B665C]">Standard state slab withholding of ₹200/month per active employee.</p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] space-y-1">
                <span className="text-[#8A6D3B] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">description</span>
                  PDF Salary Slips
                </span>
                <p className="text-[11px] text-[#6B665C]">Exported PDF payslips strictly formatted with Indian numbering &amp; Rs. symbol.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE USER DIRECTORY & ROLE ASSIGNMENT (ADMIN ONLY) */}
      {activeTab === 'users' && hasRole('Admin') && (
        <div className="bg-white border border-[#E7E2D9] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7E2D9]">
            <div>
              <h3 className="text-base font-heading font-medium text-[#1C1B19]">Live System User Accounts</h3>
              <p className="text-xs text-[#6B665C] mt-0.5">
                Real accounts registered in the database with instant role assignment controls.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchUsers} icon="refresh">
              Refresh Directory
            </Button>
          </div>

          {loadingUsers ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner message="Fetching user directory..." />
            </div>
          ) : usersList.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B665C]">
              No users found. Register accounts via the login page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E7E2D9] text-[#6B665C] text-[11px] uppercase tracking-wider font-medium">
                    <th className="py-2.5 px-3">User Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Role</th>
                    <th className="py-2.5 px-3 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E2D9]">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E8F4F1] border border-[#0F5C4A]/20 text-[#0F5C4A] font-bold text-xs flex items-center justify-center font-mono">
                            {u.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-[#1C1B19]">{u.name}</span>
                          {u._id === user?._id && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#E8F4F1] text-[#0F5C4A] rounded border border-[#0F5C4A]/20">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#6B665C] font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-[#0F5C4A] text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F5C4A]"></span>
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={u.role === 'Admin' ? 'primary' : u.role === 'Employee' ? 'default' : 'warning'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {hasRole('Admin') ? (
                          <select
                            value={u.role}
                            disabled={updatingUserId === u._id}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="bg-white border border-[#E7E2D9] text-[#1C1B19] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0F5C4A] cursor-pointer"
                          >
                            <option value="Admin">Admin</option>
                            <option value="HR Manager">HR Manager</option>
                            <option value="HR Payroll User">HR Payroll User</option>
                            <option value="HR Payroll Manager">HR Payroll Manager</option>
                            <option value="Employee">Employee</option>
                          </select>
                        ) : (
                          <span className="text-xs text-[#918C82]">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GRANULAR RBAC PERMISSIONS MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-white border border-[#E7E2D9] rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#E7E2D9]">
            <h3 className="text-base font-heading font-medium text-[#1C1B19]">Granular Role-Based Access Control Matrix</h3>
            <p className="text-xs text-[#6B665C] mt-0.5">
              Strict endpoint and UI-level security boundaries applied across all 5 user tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E7E2D9] text-[#6B665C] text-[11px] uppercase tracking-wider font-medium">
                  <th className="py-2.5 px-3">Platform Module</th>
                  <th className="py-2.5 px-3 text-[#0F5C4A]">Admin</th>
                  <th className="py-2.5 px-3 text-[#1C1B19]">HR Manager</th>
                  <th className="py-2.5 px-3 text-[#8A6D3B]">Payroll Manager</th>
                  <th className="py-2.5 px-3 text-[#6B665C]">Payroll User</th>
                  <th className="py-2.5 px-3 text-[#0F5C4A]">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D9]">
                {RBAC_MODULES.map((r) => (
                  <tr key={r.module} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3 px-3 font-medium text-[#1C1B19]">{r.module}</td>
                    <td className="py-3 px-3 text-[#0F5C4A] font-medium text-xs">{r.admin}</td>
                    <td className="py-3 px-3 text-[#1C1B19] text-xs">{r.hrMgr}</td>
                    <td className="py-3 px-3 text-[#8A6D3B] font-medium text-xs">{r.payrollMgr}</td>
                    <td className="py-3 px-3 text-[#6B665C] text-xs">{r.payrollUser}</td>
                    <td className="py-3 px-3 text-[#0F5C4A] text-xs">{r.emp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE SESSION & SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-base font-heading font-medium text-[#1C1B19]">Current Active Session</h3>
            <div className="p-4 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#6B665C]">User Name:</span>
                <span className="text-[#1C1B19] font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B665C]">Email Identifier:</span>
                <span className="text-[#1C1B19] font-mono text-[11px]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B665C]">Access Tier:</span>
                <Badge variant="primary">{user?.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B665C]">Security Protocol:</span>
                <span className="text-[#0F5C4A] font-medium font-mono text-[11px]">JWT (HMAC-SHA256)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E7E2D9] rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-base font-heading font-medium text-[#1C1B19]">System Integrity Check</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9]">
                <span className="text-[#6B665C]">Database Connection</span>
                <span className="text-[#0F5C4A] font-medium">MongoDB Atlas / Local</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9]">
                <span className="text-[#6B665C]">Payroll Engine Mode</span>
                <span className="text-[#0F5C4A] font-medium font-mono">INR (₹) MathJS AST</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9]">
                <span className="text-[#6B665C]">Multi-Tab Chime Alerts</span>
                <span className="text-[#0F5C4A] font-medium">Enabled (BroadcastChannel)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
