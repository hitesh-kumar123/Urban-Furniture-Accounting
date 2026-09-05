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
    const saved = localStorage.getItem('peoplepay360_org_settings');
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
    localStorage.setItem('peoplepay360_org_settings', JSON.stringify(companyForm));
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              System Administration
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            System &amp; Security Settings
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Corporate entity configuration, live user access directory, and granular RBAC governance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#111114] p-1 rounded border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('corporate')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'corporate'
                ? 'bg-[#1E1E24] text-[#FF8A65] font-semibold border border-white/10'
                : 'text-[#6F6C69] hover:text-[#F5F2EA]'
            }`}
          >
            Corporate
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'users'
                ? 'bg-[#1E1E24] text-[#FF8A65] font-semibold border border-white/10'
                : 'text-[#6F6C69] hover:text-[#F5F2EA]'
            }`}
          >
            Users ({usersList.length || 'Directory'})
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'rbac'
                ? 'bg-[#1E1E24] text-[#FF8A65] font-semibold border border-white/10'
                : 'text-[#6F6C69] hover:text-[#F5F2EA]'
            }`}
          >
            RBAC Matrix
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'security'
                ? 'bg-[#1E1E24] text-[#FF8A65] font-semibold border border-white/10'
                : 'text-[#6F6C69] hover:text-[#F5F2EA]'
            }`}
          >
            Session
          </button>
        </div>
      </div>

      {/* TAB 1: CORPORATE PARAMETERS */}
      {activeTab === 'corporate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 midnight-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Corporate Payroll &amp; Statutory Parameters</h3>
              <p className="text-xs text-[#6F6C69] mt-0.5">
                Indian enterprise identification, compliance currency, and standard working shift baselines.
              </p>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="staffora-label">Legal Organization Name</label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="staffora-input"
                    required
                  />
                </div>

                <div>
                  <label className="staffora-label">GSTIN / Registration Number</label>
                  <input
                    type="text"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    className="staffora-input"
                    required
                  />
                </div>

                <div>
                  <label className="staffora-label">Corporate PAN Identifier</label>
                  <input
                    type="text"
                    value={companyForm.panNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, panNumber: e.target.value })}
                    className="staffora-input"
                    required
                  />
                </div>

                <div>
                  <label className="staffora-label">Base Operating Currency</label>
                  <input
                    type="text"
                    value={companyForm.currency}
                    readOnly
                    className="staffora-input bg-[#0B0B0D] text-[#39D98A] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="staffora-label">Pay Cycle Frequency</label>
                  <input
                    type="text"
                    value={companyForm.payCycle}
                    onChange={(e) => setCompanyForm({ ...companyForm, payCycle: e.target.value })}
                    className="staffora-input"
                  />
                </div>

                <div>
                  <label className="staffora-label">Standard Work Week Schedule</label>
                  <input
                    type="text"
                    value={companyForm.standardWorkWeek}
                    onChange={(e) => setCompanyForm({ ...companyForm, standardWorkWeek: e.target.value })}
                    className="staffora-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="staffora-label">Registered Corporate Address</label>
                  <input
                    type="text"
                    value={companyForm.registeredAddress}
                    onChange={(e) => setCompanyForm({ ...companyForm, registeredAddress: e.target.value })}
                    className="staffora-input"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <Button variant="primary" size="sm" type="submit" icon="save">
                  Save Corporate Parameters
                </Button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 midnight-card p-5 space-y-3 font-mono text-xs">
            <h4 className="text-xs font-bold text-[#F5F2EA] font-display">Compliance Highlights</h4>
            <div className="space-y-2 text-[11px] text-[#A6A3A0]">
              <div className="p-2.5 rounded bg-[#111114] border border-white/5 space-y-1">
                <span className="text-[#39D98A] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  EPFO &amp; PF Deduction
                </span>
                <p className="text-[10px] text-[#6F6C69]">12% Statutory calculation formula applied on Basic CTC wage.</p>
              </div>

              <div className="p-2.5 rounded bg-[#111114] border border-white/5 space-y-1">
                <span className="text-[#58B7FF] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                  Professional Tax (PT)
                </span>
                <p className="text-[10px] text-[#6F6C69]">Standard state slab withholding of ₹200/month per active employee.</p>
              </div>

              <div className="p-2.5 rounded bg-[#111114] border border-white/5 space-y-1">
                <span className="text-[#F5B942] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">description</span>
                  PDF Salary Slips
                </span>
                <p className="text-[10px] text-[#6F6C69]">Exported PDF payslips strictly generated with Indian numbering &amp; Rs. format.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE USER DIRECTORY & ROLE ASSIGNMENT */}
      {activeTab === 'users' && (
        <div className="midnight-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Live System User Accounts</h3>
              <p className="text-xs text-[#6F6C69] mt-0.5">
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
            <div className="py-8 text-center text-xs text-[#6F6C69]">
              No users found. Register accounts via the login page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#6F6C69] text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">User Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Role</th>
                    <th className="py-2.5 px-3 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#1E1E24] border border-white/10 text-[#FF8A65] font-bold text-[10px] flex items-center justify-center">
                            {u.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <span className="font-semibold text-[#F5F2EA] font-sans">{u.name}</span>
                          {u._id === user?._id && (
                            <span className="text-[9px] px-1 bg-[#39D98A]/10 text-[#39D98A] rounded border border-[#39D98A]/20">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#A6A3A0]">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[#39D98A] text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A]"></span>
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
                            className="bg-[#111114] border border-white/15 text-[#F5F2EA] text-[11px] rounded px-2 py-1 focus:outline-none focus:border-[#FF6B3D] cursor-pointer"
                          >
                            <option value="Admin">Admin</option>
                            <option value="HR Manager">HR Manager</option>
                            <option value="HR Payroll User">HR Payroll User</option>
                            <option value="HR Payroll Manager">HR Payroll Manager</option>
                            <option value="Employee">Employee</option>
                          </select>
                        ) : (
                          <span className="text-[10px] text-[#6F6C69]">Protected</span>
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
        <div className="midnight-card p-5 space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Granular Role-Based Access Control Matrix</h3>
            <p className="text-xs text-[#6F6C69] mt-0.5">
              Strict endpoint and UI-level security boundaries applied across all 5 user tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[#6F6C69] text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Platform Module</th>
                  <th className="py-2.5 px-3 text-[#FF8A65]">Admin</th>
                  <th className="py-2.5 px-3 text-[#58B7FF]">HR Manager</th>
                  <th className="py-2.5 px-3 text-[#F5B942]">Payroll Manager</th>
                  <th className="py-2.5 px-3 text-[#E2E8F0]">Payroll User</th>
                  <th className="py-2.5 px-3 text-[#39D98A]">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {RBAC_MODULES.map((r) => (
                  <tr key={r.module} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#F5F2EA] font-sans">{r.module}</td>
                    <td className="py-3 px-3 text-[#FF8A65] text-[11px]">{r.admin}</td>
                    <td className="py-3 px-3 text-[#58B7FF] text-[11px]">{r.hrMgr}</td>
                    <td className="py-3 px-3 text-[#F5B942] text-[11px]">{r.payrollMgr}</td>
                    <td className="py-3 px-3 text-[#A6A3A0] text-[11px]">{r.payrollUser}</td>
                    <td className="py-3 px-3 text-[#39D98A] text-[11px]">{r.emp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE SESSION & SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <div className="midnight-card p-5 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Current Active Session</h3>
            <div className="p-3.5 bg-[#111114] rounded border border-white/5 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6F6C69]">User Name:</span>
                <span className="text-[#F5F2EA] font-bold font-sans">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F6C69]">Email Identifier:</span>
                <span className="text-[#A6A3A0]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6F6C69]">Access Tier:</span>
                <Badge variant="primary">{user?.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F6C69]">Security Protocol:</span>
                <span className="text-[#39D98A]">JWT (HMAC-SHA256)</span>
              </div>
            </div>
          </div>

          <div className="midnight-card p-5 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">System Integrity Check</h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-[#111114] border border-white/5">
                <span className="text-[#A6A3A0]">Database Connection</span>
                <span className="text-[#39D98A] font-semibold">MongoDB Atlas / Local</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#111114] border border-white/5">
                <span className="text-[#A6A3A0]">Payroll Engine Mode</span>
                <span className="text-[#39D98A] font-semibold">INR (₹) Statutory MathJS</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#111114] border border-white/5">
                <span className="text-[#A6A3A0]">Multi-Tab Chime Alerts</span>
                <span className="text-[#39D98A] font-semibold">Enabled (BroadcastChannel)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
