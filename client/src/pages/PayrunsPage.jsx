import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrunApi } from '../api/payrunApi';
import { salaryApi } from '../api/salaryApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PayrunsPage = () => {
  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Creation Wizard Modal State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: `Payroll Run — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    salaryStructureId: '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [fetchingEligible, setFetchingEligible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchPayruns = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        payrunApi.getAll({ status: statusFilter || undefined }),
        salaryApi.getStructures()
      ]);

      if (pRes.success) setPayruns(pRes.data);
      if (sRes.success) {
        setStructures(sRes.data);
        if (sRes.data.length > 0 && !wizardData.salaryStructureId) {
          setWizardData((prev) => ({ ...prev, salaryStructureId: sRes.data[0]._id }));
        }
      }
    } catch (err) {
      showToast('Failed to load payruns', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, [statusFilter]);

  // Handle Wizard Next Step: Fetch Eligible Employees
  const handleProceedToStep2 = async (e) => {
    e.preventDefault();
    if (!wizardData.salaryStructureId) {
      showToast('Please select a Salary Structure', 'warning');
      return;
    }
    setFetchingEligible(true);
    try {
      const res = await payrunApi.getEligibleEmployees(
        wizardData.salaryStructureId,
        wizardData.periodStart,
        wizardData.periodEnd
      );
      if (res.success) {
        setEligibleEmployees(res.data);
        // By default select all eligible
        setSelectedEmpIds(res.data.map((e) => e._id));
        setWizardStep(2);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch eligible employees', 'error');
    } finally {
      setFetchingEligible(false);
    }
  };

  // Toggle single employee
  const handleToggleEmployee = (id) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all / Deselect all
  const handleToggleAllEmployees = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e._id));
    }
  };

  // Final submit payrun creation
  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      showToast('Please select at least one employee for the payrun', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: wizardData.name,
        salaryStructure: wizardData.salaryStructureId,
        periodStart: wizardData.periodStart,
        periodEnd: wizardData.periodEnd,
        selectedEmployees: selectedEmpIds
      };

      const res = await payrunApi.create(payload);
      if (res.success) {
        showToast('Payrun initialized successfully!', 'success');
        setShowWizard(false);
        navigate(`/payruns/${res.data._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create payrun', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Draft':
        return <Badge variant="neutral">Draft</Badge>;
      case 'Computed':
        return <Badge variant="purple">Computed</Badge>;
      case 'Validated':
        return <Badge variant="info">Validated</Badge>;
      case 'Paid':
        return <Badge variant="success">Paid</Badge>;
      case 'PayslipsSent':
        return <Badge variant="success">Distributed</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{st}</Badge>;
    }
  };

  const canCreate = hasRole('Admin', 'HR Payroll Manager');

  // Stats calculation
  const totalDisbursed = payruns
    .filter((p) => p.status === 'Paid' || p.status === 'PayslipsSent')
    .reduce((acc, p) => acc + (p.totals?.totalNet || 0), 0);
  const pendingValidationCount = payruns.filter((p) => p.status === 'Computed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Payroll Batches & Payruns</h1>
          <p className="text-sm text-slate-500 mt-1">
            Execute deterministic payroll computations, validate earnings & deductions, and disburse digital payslips.
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            onClick={() => {
              setWizardStep(1);
              setShowWizard(true);
            }}
            className="flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Payroll Run
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Batches</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-on-surface mt-2">{payruns.length}</div>
          <span className="text-[11px] text-slate-400">All historical pay cycles</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Disbursed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ${totalDisbursed.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">Successfully paid runs</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Validation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{pendingValidationCount}</div>
          <span className="text-[11px] text-slate-400">Computed awaiting audit</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary Structures</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{structures.length}</div>
          <span className="text-[11px] text-slate-400">Configured salary profiles</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Computed">Computed</option>
            <option value="Validated">Validated</option>
            <option value="Paid">Paid</option>
            <option value="PayslipsSent">Distributed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Payrun Registry Table */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : payruns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">savings</span>
            <p className="text-sm font-semibold text-slate-600">No payruns created yet.</p>
            {canCreate && (
              <Button
                variant="primary"
                onClick={() => {
                  setWizardStep(1);
                  setShowWizard(true);
                }}
                className="mt-4"
              >
                Initialize First Payrun
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Payrun Batch Name</th>
                  <th className="px-5 py-3.5">Salary Structure</th>
                  <th className="px-5 py-3.5">Pay Period</th>
                  <th className="px-5 py-3.5 text-center">Employees</th>
                  <th className="px-5 py-3.5 text-right">Total Net Pay</th>
                  <th className="px-5 py-3.5">Batch Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payruns.map((p) => {
                  const pStart = new Date(p.periodStart).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  });
                  const pEnd = new Date(p.periodEnd).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={p._id}
                      onClick={() => navigate(`/payruns/${p._id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-on-surface text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Created {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        {p.salaryStructure?.name || 'Standard Structure'}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                        {pStart} — {pEnd}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 text-primary border border-indigo-100 rounded-lg text-xs font-bold">
                          {p.selectedEmployees?.length || p.totals?.employeeCount || 0}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-on-surface text-sm">
                        ${(p.totals?.totalNet || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">{getStatusBadge(p.status)}</td>

                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/payruns/${p._id}`)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">settings_suggest</span>
                          Open Engine
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2-Step Creation Wizard Modal */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title={wizardStep === 1 ? 'Step 1: Payrun Details & Period' : 'Step 2: Confirm Eligible Employees'}
        size="2xl"
      >
        {wizardStep === 1 ? (
          <form onSubmit={handleProceedToStep2} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payrun Batch Name *
              </label>
              <input
                type="text"
                required
                value={wizardData.name}
                onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Salary Structure *
              </label>
              <select
                required
                value={wizardData.salaryStructureId}
                onChange={(e) => setWizardData({ ...wizardData, salaryStructureId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Period Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={wizardData.periodStart}
                  onChange={(e) => setWizardData({ ...wizardData, periodStart: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Period End Date *
                </label>
                <input
                  type="date"
                  required
                  value={wizardData.periodEnd}
                  onChange={(e) => setWizardData({ ...wizardData, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" type="button" onClick={() => setShowWizard(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={fetchingEligible}>
                {fetchingEligible ? 'Scanning Contracts...' : 'Next: Select Employees →'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  {eligibleEmployees.length} active employee contracts matched for structure & period.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleAllEmployees}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {eligibleEmployees.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">
                No active employee contracts found matching this salary structure for this date range.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {eligibleEmployees.map((emp) => {
                  const isChecked = selectedEmpIds.includes(emp._id);
                  return (
                    <div
                      key={emp._id}
                      onClick={() => handleToggleEmployee(emp._id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <div>
                          <span className="text-xs font-bold text-on-surface block">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {emp.employeeCode} • {emp.department} • {emp.jobPosition}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setWizardStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCreatePayrun}
                disabled={submitting || selectedEmpIds.length === 0}
              >
                {submitting ? 'Creating Payrun...' : `Initialize Payrun (${selectedEmpIds.length} Selected)`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
