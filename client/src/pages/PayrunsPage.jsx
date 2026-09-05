import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrunApi } from '../api/payrunApi';
import { salaryStructureApi } from '../api/salaryStructureApi';
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
  
  // 2-Step Creation Wizard States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [payrunMode, setPayrunMode] = useState('batch'); // 'batch' | 'single'
  const [wizardData, setWizardData] = useState({
    name: '',
    salaryStructureId: '',
    periodStart: '',
    periodEnd: ''
  });
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [fetchingEligible, setFetchingEligible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchPayruns = async () => {
    setLoading(true);
    try {
      const res = await payrunApi.getAll({
        status: statusFilter || undefined
      });
      if (res.success) {
        setPayruns(res.data);
      }
    } catch (err) {
      showToast('Failed to load payruns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStructures = async () => {
    try {
      const res = await salaryStructureApi.getAll();
      if (res.success) {
        setStructures(res.data);
        if (res.data.length > 0 && !wizardData.salaryStructureId) {
          setWizardData((prev) => ({ ...prev, salaryStructureId: res.data[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayruns();
    fetchStructures();
  }, [statusFilter]);

  // Set default dates for Wizard (Current month)
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
    const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    setWizardData((prev) => ({
      ...prev,
      name: `${monthName} Regular Payrun`,
      periodStart: firstDay,
      periodEnd: lastDay
    }));
  }, []);

  const handleProceedToStep2 = async (e) => {
    e.preventDefault();
    if (!wizardData.name || !wizardData.salaryStructureId || !wizardData.periodStart || !wizardData.periodEnd) {
      showToast('Please fill all required period fields', 'warning');
      return;
    }

    setFetchingEligible(true);
    try {
      const res = await payrunApi.getEligibleEmployees({
        salaryStructureId: wizardData.salaryStructureId,
        periodStart: wizardData.periodStart,
        periodEnd: wizardData.periodEnd
      });

      if (res.success) {
        setEligibleEmployees(res.data);
        setSearchEmployee('');
        setDeptFilter('');
        // Pre-select mode: if single mode, don't select all; if batch, select all
        if (payrunMode === 'single') {
          const firstId = res.data[0]?.employee?._id || res.data[0]?._id;
          setSelectedEmpIds(firstId ? [firstId] : []);
        } else {
          const allIds = res.data.map((item) => item.employee?._id || item._id);
          setSelectedEmpIds(allIds);
        }
        setWizardStep(2);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to scan eligible employees', 'error');
    } finally {
      setFetchingEligible(false);
    }
  };

  const handleToggleEmployee = (empId) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectOnlyThis = (e, empId) => {
    e.stopPropagation();
    setSelectedEmpIds([empId]);
  };

  const handleToggleAllEmployees = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((item) => item.employee?._id || item._id));
    }
  };

  const handleClearAll = () => {
    setSelectedEmpIds([]);
  };

  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      showToast('Select at least 1 employee for this payrun', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await payrunApi.create({
        name: wizardData.name,
        salaryStructure: wizardData.salaryStructureId,
        periodStart: wizardData.periodStart,
        periodEnd: wizardData.periodEnd,
        selectedEmployees: selectedEmpIds
      });

      if (res.success) {
        showToast('Payrun initialized successfully', 'success');
        setShowWizard(false);
        setWizardStep(1);
        navigate(`/payruns/${res.data._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initialize payrun batch', 'error');
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Payroll Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Payrun Batches &amp; Processing
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Deterministic calculation engine, tax and deduction rules, and payslip disbursement ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block font-medium">Total Payruns</span>
          <div className="text-2xl font-bold text-[#1C1B19] font-mono mt-1">{payruns.length}</div>
        </div>
        <div className="bg-[#FAF4E8] rounded-xl border border-[#8A6D3B]/30 p-4 shadow-sm">
          <span className="text-xs text-[#8A6D3B] uppercase block font-semibold">Net Disbursed</span>
          <div className="text-2xl font-bold text-[#8A6D3B] font-mono mt-1">₹{totalDisbursed.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block font-medium">Pending Validation</span>
          <div className="text-2xl font-bold text-[#8A6D3B] font-mono mt-1">
            {payruns.filter((p) => p.status === 'Computed').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block font-medium">Salary Structures</span>
          <div className="text-2xl font-bold text-[#0F5C4A] font-mono mt-1">{structures.length}</div>
        </div>
      </div>

      {/* Payrun Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Scanning payrun batches..." />
        ) : payruns.length === 0 ? (
          <div className="p-12 text-center text-[#6B665C] text-xs">
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
                      <div className="font-medium text-[#1C1B19]">{p.name}</div>
                      <div className="text-[11px] font-mono text-[#6B665C]">
                        ID: {p._id.slice(-6)}
                      </div>
                    </td>

                    <td className="text-xs text-[#6B665C]">
                      {p.salaryStructure?.name || 'Standard Structure'}
                    </td>

                    <td className="font-mono text-xs text-[#6B665C]">
                      {pStart} — {pEnd}
                    </td>

                    <td className="text-center font-mono text-xs text-[#1C1B19]">
                      {p.selectedEmployees?.length || p.totals?.employeeCount || 0}
                    </td>

                    <td className="text-right font-mono font-bold text-[#8A6D3B]">
                      ₹{(p.totals?.totalNet || 0).toLocaleString('en-IN')}
                    </td>

                    <td>{getStatusBadge(p.status)}</td>

                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/payruns/${p._id}`)}
                      >
                        Open Engine
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
          <form onSubmit={handleProceedToStep2} className="space-y-4 text-xs">
            {/* Payrun Scope Toggle */}
            <div>
              <label className="staffora-label">Payrun Scope &amp; Target Mode</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF9F6] border border-[#E7E2D9] rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPayrunMode('batch');
                    setWizardData((prev) => ({
                      ...prev,
                      name: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Regular Payrun`
                    }));
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    payrunMode === 'batch'
                      ? 'bg-[#0F5C4A] text-white shadow-xs'
                      : 'text-[#6B665C] hover:text-[#1C1B19]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">groups</span>
                  Standard Full Batch (All Staff)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayrunMode('single');
                    setWizardData((prev) => ({
                      ...prev,
                      name: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Single Employee Off-Cycle`
                    }));
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    payrunMode === 'single'
                      ? 'bg-[#0F5C4A] text-white shadow-xs'
                      : 'text-[#6B665C] hover:text-[#1C1B19]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  Single Employee (Off-Cycle)
                </button>
              </div>
            </div>

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
                className="staffora-input text-xs"
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

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
              <Button variant="secondary" type="button" onClick={() => setShowWizard(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={fetchingEligible}>
                {fetchingEligible ? 'Scanning Contracts...' : payrunMode === 'single' ? 'Next: Pick Employee' : 'Next: Select Employees'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-xs">
            {/* Header / Selection Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#FAF9F6] border border-[#E7E2D9] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#0F5C4A] bg-[#E8F4F1] px-2 py-0.5 rounded border border-[#0F5C4A]/20">
                  {selectedEmpIds.length} of {eligibleEmployees.length} Selected
                </span>
                <span className="text-[11px] text-[#6B665C]">
                  {payrunMode === 'single' ? 'Pick the single employee for off-cycle payout' : 'Review employee inclusions'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-[#B5482E] font-medium hover:underline px-1.5 py-0.5"
                >
                  Clear All (0)
                </button>
                <button
                  type="button"
                  onClick={handleToggleAllEmployees}
                  className="text-xs text-[#0F5C4A] font-medium hover:underline px-1.5 py-0.5"
                >
                  Select All ({eligibleEmployees.length})
                </button>
              </div>
            </div>

            {/* Quick Search & Department Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#918C82]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by employee name, EMP ID, or position..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="staffora-input pl-8 py-1.5 text-xs font-body w-full"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="staffora-input py-1.5 px-2 text-xs w-auto font-medium"
              >
                <option value="">All Departments</option>
                {Array.from(new Set(eligibleEmployees.map((i) => (i.employee || i).department).filter(Boolean))).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Selection List */}
            {eligibleEmployees.length === 0 ? (
              <div className="p-6 text-center text-[#6B665C] border border-dashed border-[#E7E2D9] rounded-lg">
                No active employee contracts found matching this salary structure for this date range.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-[#E7E2D9] rounded-lg divide-y divide-[#E7E2D9] bg-white">
                {eligibleEmployees
                  .filter((item) => {
                    const emp = item.employee || item;
                    const searchStr = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeId || ''} ${emp.jobPosition || ''}`.toLowerCase();
                    const matchesSearch = !searchEmployee || searchStr.includes(searchEmployee.toLowerCase());
                    const matchesDept = !deptFilter || emp.department === deptFilter;
                    return matchesSearch && matchesDept;
                  })
                  .map((item) => {
                    const emp = item.employee || item;
                    const contract = item.applicableContract;
                    const empId = emp._id;
                    const isChecked = selectedEmpIds.includes(empId);
                    return (
                      <div
                        key={empId || item._id}
                        onClick={() => handleToggleEmployee(empId)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#E8F4F1]/50' : 'hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-[#0F5C4A] focus:ring-0 h-4 w-4 bg-white border-[#E7E2D9]"
                          />
                          <div>
                            <span className="text-xs font-semibold text-[#1C1B19] block">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[11px] font-mono text-[#6B665C]">
                              {emp.employeeId || 'EMP'} • {emp.department || 'General'} • {emp.jobPosition || 'Staff'} {contract ? `• ₹${Number(contract.wage).toLocaleString('en-IN')}/mo` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleSelectOnlyThis(e, empId)}
                            className="text-[11px] font-medium text-[#0F5C4A] bg-white hover:bg-[#FAF9F6] border border-[#E7E2D9] px-2 py-0.5 rounded shadow-2xs transition-colors"
                            title="Uncheck all others and select ONLY this employee"
                          >
                            Only Select This
                          </button>
                          {item.matchesSelectedStructure ? (
                            <span className="text-[10px] font-mono font-bold text-[#0F5C4A] bg-[#E8F4F1] border border-[#0F5C4A]/20 px-1.5 py-0.5 rounded">
                              Matches
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#6B665C] bg-[#FAF9F6] border border-[#E7E2D9] px-1.5 py-0.5 rounded">
                              Linked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[#E7E2D9]">
              <Button variant="secondary" onClick={() => setWizardStep(1)}>
                Back
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
