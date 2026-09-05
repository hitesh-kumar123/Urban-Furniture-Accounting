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

  // Wizard Modal
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: `Payrun — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
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
        const rawList = res.data || [];
        const empIds = rawList.map((item) => item.employee?._id || item._id).filter(Boolean);
        setEligibleEmployees(rawList);
        setSelectedEmpIds(empIds);
        setWizardStep(2);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch eligible employees', 'error');
    } finally {
      setFetchingEligible(false);
    }
  };

  const handleToggleEmployee = (id) => {
    if (!id) return;
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllEmployees = () => {
    const allIds = eligibleEmployees.map((item) => item.employee?._id || item._id).filter(Boolean);
    if (selectedEmpIds.length === allIds.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(allIds);
    }
  };

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
        showToast('Payrun initialized successfully', 'success');
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
        return <Badge variant="default">Draft</Badge>;
      case 'Computed':
        return <Badge variant="primary">Computed</Badge>;
      case 'Validated':
        return <Badge variant="info">Validated</Badge>;
      case 'Paid':
        return <Badge variant="success">Paid</Badge>;
      case 'PayslipsSent':
        return <Badge variant="success">Distributed</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{st}</Badge>;
    }
  };

  const canCreate = hasRole('Admin', 'HR Payroll Manager');
  const totalDisbursed = payruns
    .filter((p) => p.status === 'Paid' || p.status === 'PayslipsSent')
    .reduce((acc, p) => acc + (p.totals?.totalNet || 0), 0);

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Payroll Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Payrun Batches &amp; Processing
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Deterministic calculation engine, tax and deduction rules, and payslip disbursement ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Computed">Computed</option>
            <option value="Validated">Validated</option>
            <option value="Paid">Paid</option>
            <option value="PayslipsSent">Distributed</option>
          </select>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setWizardStep(1);
                setShowWizard(true);
              }}
              icon="add"
            >
              New Payrun
            </Button>
          )}
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Total Payruns</span>
          <div className="text-xl font-bold text-[#F5F2EA] mt-1">{payruns.length}</div>
        </div>
        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Net Disbursed</span>
          <div className="text-xl font-bold text-[#39D98A] mt-1">${totalDisbursed.toLocaleString()}</div>
        </div>
        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Pending Validation</span>
          <div className="text-xl font-bold text-[#F5B942] mt-1">
            {payruns.filter((p) => p.status === 'Computed').length}
          </div>
        </div>
        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Salary Structures</span>
          <div className="text-xl font-bold text-[#58B7FF] mt-1">{structures.length}</div>
        </div>
      </div>

      {/* Payrun Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Scanning payrun batches..." />
        ) : payruns.length === 0 ? (
          <div className="p-12 text-center text-[#6F6C69] font-mono text-xs">
            No payruns found. Click "New Payrun" to initialize a batch.
          </div>
        ) : (
          <table className="staffora-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Salary Structure</th>
                <th>Pay Period</th>
                <th className="text-center">Employees</th>
                <th className="text-right">Total Net</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
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
                    className="cursor-pointer"
                  >
                    <td>
                      <div className="font-semibold text-[#F5F2EA]">{p.name}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        ID: {p._id.slice(-6)}
                      </div>
                    </td>

                    <td className="text-xs text-[#A6A3A0]">
                      {p.salaryStructure?.name || 'Standard Structure'}
                    </td>

                    <td className="font-mono text-xs text-[#A6A3A0]">
                      {pStart} — {pEnd}
                    </td>

                    <td className="text-center font-mono text-xs">
                      {p.selectedEmployees?.length || p.totals?.employeeCount || 0}
                    </td>

                    <td className="text-right font-mono font-bold text-[#F5F2EA]">
                      ${(p.totals?.totalNet || 0).toLocaleString()}
                    </td>

                    <td>{getStatusBadge(p.status)}</td>

                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/payruns/${p._id}`)}
                        className="text-xs font-mono"
                      >
                        Open Engine →
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 2-Step Creation Wizard Modal */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title={wizardStep === 1 ? 'Step 1: Payrun Period & Salary Structure' : 'Step 2: Confirm Eligible Employees'}
        maxWidth="max-w-xl"
      >
        {wizardStep === 1 ? (
          <form onSubmit={handleProceedToStep2} className="space-y-4">
            <div>
              <label className="staffora-label">Payrun Batch Name</label>
              <input
                type="text"
                required
                value={wizardData.name}
                onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                className="staffora-input font-mono text-xs"
              />
            </div>

            <div>
              <label className="staffora-label">Salary Structure</label>
              <select
                required
                value={wizardData.salaryStructureId}
                onChange={(e) => setWizardData({ ...wizardData, salaryStructureId: e.target.value })}
                className="staffora-input font-mono text-xs"
              >
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="staffora-label">Period Start</label>
                <input
                  type="date"
                  required
                  value={wizardData.periodStart}
                  onChange={(e) => setWizardData({ ...wizardData, periodStart: e.target.value })}
                  className="staffora-input font-mono text-xs"
                />
              </div>
              <div>
                <label className="staffora-label">Period End</label>
                <input
                  type="date"
                  required
                  value={wizardData.periodEnd}
                  onChange={(e) => setWizardData({ ...wizardData, periodEnd: e.target.value })}
                  className="staffora-input font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#A6A3A0]">
                {eligibleEmployees.length} matching active employee contracts.
              </span>
              <button
                type="button"
                onClick={handleToggleAllEmployees}
                className="text-[#FF8A65] hover:underline"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {eligibleEmployees.length === 0 ? (
              <div className="p-6 text-center text-[#6F6C69] font-mono text-xs border border-dashed border-white/10 rounded">
                No active employee contracts found matching this salary structure for this date range.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-white/10 rounded divide-y divide-white/5 bg-[#111114]">
                {eligibleEmployees.map((item) => {
                  const emp = item.employee || item;
                  const contract = item.applicableContract;
                  const empId = emp._id;
                  const isChecked = selectedEmpIds.includes(empId);
                  return (
                    <div
                      key={empId || item._id}
                      onClick={() => handleToggleEmployee(empId)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#1E1E24]' : 'hover:bg-[#17171B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-[#FF6B3D] focus:ring-0 h-3.5 w-3.5 bg-[#0B0B0D] border-white/20"
                        />
                        <div>
                          <span className="text-xs font-semibold text-[#F5F2EA] block">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] font-mono text-[#6F6C69]">
                            {emp.employeeId || emp.employeeCode || 'EMP'} • {emp.department || 'General'} • {emp.jobPosition || 'Staff'} {contract ? `• $${contract.wage}/mo` : ''}
                          </span>
                        </div>
                      </div>
                      {item.matchesSelectedStructure ? (
                        <span className="text-[10px] font-mono font-bold text-[#39D98A] bg-[#39D98A]/10 border border-[#39D98A]/20 px-2 py-0.5 rounded">
                          Matches Structure
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#A6A3A0] bg-[#17171B] border border-white/10 px-2 py-0.5 rounded">
                          Linked
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <Button variant="secondary" onClick={() => setWizardStep(1)}>
                ← Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCreatePayrun}
                disabled={submitting || selectedEmpIds.length === 0}
              >
                {submitting ? 'Initializing...' : `Create Payrun (${selectedEmpIds.length} Staff)`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
