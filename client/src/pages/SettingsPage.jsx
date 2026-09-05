import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [companyForm, setCompanyForm] = useState({
    companyName: 'Urban Furniture International Corp.',
    taxId: 'US-EIN-98472910',
    currency: 'USD ($)',
    payCycle: 'Monthly (Last Calendar Day)',
    overtimeMultiplier: '1.5x',
    standardWorkWeek: '40 Hours'
  });

  const handleSaveCompany = (e) => {
    e.preventDefault();
    showToast('Company system settings updated', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">System & Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure corporate parameters, statutory defaults, RBAC security profiles, and API integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Company Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-on-surface mb-4">Corporate Payroll Parameters</h3>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tax / Statutory Registration ID
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Base Currency
                  </label>
                  <input
                    type="text"
                    value={companyForm.currency}
                    onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pay Cycle Frequency
                  </label>
                  <input
                    type="text"
                    value={companyForm.payCycle}
                    onChange={(e) => setCompanyForm({ ...companyForm, payCycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Overtime Multiplier Rate
                  </label>
                  <input
                    type="text"
                    value={companyForm.overtimeMultiplier}
                    onChange={(e) => setCompanyForm({ ...companyForm, overtimeMultiplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Standard Full-Time Capacity
                  </label>
                  <input
                    type="text"
                    value={companyForm.standardWorkWeek}
                    onChange={(e) => setCompanyForm({ ...companyForm, standardWorkWeek: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* RBAC Matrix Card */}
          <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-on-surface mb-2">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500 mb-4">Granular permissions configured across platform modules.</p>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Employee Hub</th>
                    <th className="px-4 py-3">Contracts</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3">Time Off</th>
                    <th className="px-4 py-3">Payrun Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-3 font-bold text-primary">Admin</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-800">HR Manager</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Approve</td>
                    <td className="px-4 py-3 text-slate-400">View Only</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-purple-700">HR Payroll Manager</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Approve</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Full Engine</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-700">HR Payroll User</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">Read Only</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">Read Only</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Log</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">Read</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">Draft & Compute</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-500">Employee</td>
                    <td className="px-4 py-3 text-slate-400">Self</td>
                    <td className="px-4 py-3 text-slate-400">Self</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Punch</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">Request</td>
                    <td className="px-4 py-3 text-slate-400">Own Payslips</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: User Account & Security */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-on-surface mb-3">Active Session Profile</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">{user?.name}</h4>
                <span className="text-xs text-slate-500 block">{user?.email}</span>
                <Badge variant="purple" className="mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Security Scheme</span>
                <span className="font-semibold text-slate-700">JWT Bearer (HS256)</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Refresh Session</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Linked Employee ID</span>
                <span className="font-mono text-slate-700">{user?.employee || 'Admin Root'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Production Ready
            </div>
            <h4 className="text-base font-bold text-white">Deterministic Payroll Core</h4>
            <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
              Staffora uses server-side deterministic rule execution with Joi payload validation, bcrypt hashing, and PDFKit certified payslips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
