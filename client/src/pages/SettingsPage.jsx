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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
            System Administration
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
          System &amp; Security Settings
        </h1>
        <p className="text-xs text-[#A6A3A0] mt-0.5">
          Corporate parameters, statutory defaults, and RBAC matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: Company Profile Settings */}
        <div className="lg:col-span-7 midnight-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Corporate Payroll Parameters</h3>
          <form onSubmit={handleSaveCompany} className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="staffora-label">Legal Company Name</label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="staffora-input"
                />
              </div>

              <div>
                <label className="staffora-label">Tax / EIN Registration</label>
                <input
                  type="text"
                  value={companyForm.taxId}
                  onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                  className="staffora-input"
                />
              </div>

              <div>
                <label className="staffora-label">Base Currency</label>
                <input
                  type="text"
                  value={companyForm.currency}
                  onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                  className="staffora-input"
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
                <label className="staffora-label">Overtime Multiplier</label>
                <input
                  type="text"
                  value={companyForm.overtimeMultiplier}
                  onChange={(e) => setCompanyForm({ ...companyForm, overtimeMultiplier: e.target.value })}
                  className="staffora-input text-[#39D98A]"
                />
              </div>

              <div>
                <label className="staffora-label">Standard Work Week</label>
                <input
                  type="text"
                  value={companyForm.standardWorkWeek}
                  onChange={(e) => setCompanyForm({ ...companyForm, standardWorkWeek: e.target.value })}
                  className="staffora-input"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <Button variant="primary" size="sm" type="submit">
                Save System Parameters
              </Button>
            </div>
          </form>
        </div>

        {/* Right 5 Cols: Active RBAC Matrix & Session Info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="midnight-card p-5 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Active Session &amp; Security</h3>
            <div className="p-3 bg-[#17171B] rounded border border-white/5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6F6C69]">Authenticated User:</span>
                <span className="text-[#F5F2EA] font-bold">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F6C69]">User Email:</span>
                <span className="text-[#A6A3A0]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6F6C69]">Assigned Role:</span>
                <Badge variant="primary">{user?.role}</Badge>
              </div>
            </div>
          </div>

          <div className="midnight-card p-5 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Role Access Rights Matrix</h3>
            <div className="space-y-1.5">
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between items-center">
                <span className="text-[#F5F2EA]">Admin</span>
                <span className="text-[10px] text-[#39D98A]">Full System Control</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between items-center">
                <span className="text-[#F5F2EA]">HR Payroll Manager</span>
                <span className="text-[10px] text-[#FF8A65]">Run &amp; Validate Payruns</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between items-center">
                <span className="text-[#F5F2EA]">HR Manager</span>
                <span className="text-[10px] text-[#58B7FF]">Employee &amp; Time Off Mgmt</span>
              </div>
              <div className="p-2 bg-[#17171B] rounded border border-white/5 flex justify-between items-center">
                <span className="text-[#F5F2EA]">Employee</span>
                <span className="text-[10px] text-[#6F6C69]">Self-Service Vault</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
