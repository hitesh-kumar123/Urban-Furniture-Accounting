import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { payrunApi } from '../api/payrunApi';
import { payslipApi } from '../api/payslipApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PIPELINE_STAGES = [
  { id: 1, name: 'Eligible Staff', icon: 'badge', desc: 'Scan employee roster' },
  { id: 2, name: 'Active Contracts', icon: 'description', desc: 'Validate wage & schedules' },
  { id: 3, name: 'Overtime Hours', icon: 'more_time', desc: 'Aggregate attendance logs' },
  { id: 4, name: 'Approved Leaves', icon: 'flight_takeoff', desc: 'Compute paid/unpaid days' },
  { id: 5, name: 'Salary Rules', icon: 'calculate', desc: 'Execute sequential engine' },
  { id: 6, name: 'Net & Tax', icon: 'account_balance', desc: 'Deductions & net compute' },
  { id: 7, name: 'Payslips Ready', icon: 'receipt_long', desc: 'Generate digital ledger' }
];

export const PayrunDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [payrun, setPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [computingStage, setComputingStage] = useState(null);

  // Inspector Modal State
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);

  const fetchPayrun = async () => {
    setLoading(true);
    try {
      const res = await payrunApi.getById(id);
      if (res.success) {
        setPayrun(res.data);
      }
    } catch (err) {
      showToast('Failed to load payrun details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPayrun();
  }, [id]);

  // Handle Compute Engine Execution with Pipeline Animation
  const handleCompute = async () => {
    setActionLoading(true);
    setComputingStage(1);

    // Simulate animated pipeline stages progression visually for high fidelity UX
    const interval = setInterval(() => {
      setComputingStage((prev) => (prev < 6 ? prev + 1 : prev));
    }, 400);

    try {
      const res = await payrunApi.compute(id);
      clearInterval(interval);
      setComputingStage(7);
      if (res.success) {
        showToast('Payroll engine computed successfully!', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      clearInterval(interval);
      showToast(err.response?.data?.message || 'Compute failed', 'error');
    } finally {
      setTimeout(() => {
        setComputingStage(null);
        setActionLoading(false);
      }, 500);
    }
  };

  // Handle Validate Payrun
  const handleValidate = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.validate(id);
      if (res.success) {
        showToast('Payrun validated and locked!', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Validation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Paid
  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.markPaid(id);
      if (res.success) {
        showToast('Payrun marked as Paid!', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update payment status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Send Payslips
  const handleSendPayslips = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.sendPayslips(id);
      if (res.success) {
        showToast('Digital payslips dispatched to employees!', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to distribute payslips', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Download Single PDF
  const handleDownloadPDF = async (payslipId, empName) => {
    try {
      await payslipApi.downloadPDF(payslipId, `Payslip_${empName?.replace(/\s+/g, '_')}.pdf`);
      showToast('Downloading payslip PDF...', 'info');
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    }
  };

  // Inspector modal open
  const handleOpenInspector = (payslip) => {
    setSelectedPayslip(payslip);
    setShowInspectorModal(true);
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

  const canManage = hasRole('Admin', 'HR Payroll Manager');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Payrun Not Found</h3>
        <Button variant="primary" onClick={() => navigate('/payruns')} className="mt-4">
          Back to Payruns
        </Button>
      </div>
    );
  }

  const pStart = new Date(payrun.periodStart).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const pEnd = new Date(payrun.periodEnd).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isComputed = ['Computed', 'Validated', 'Paid', 'PayslipsSent'].includes(payrun.status);
  const isValidated = ['Validated', 'Paid', 'PayslipsSent'].includes(payrun.status);
  const isPaid = ['Paid', 'PayslipsSent'].includes(payrun.status);
  const isSent = payrun.status === 'PayslipsSent';

  // Determine current active pipeline step
  let activeStep = 1;
  if (computingStage) activeStep = computingStage;
  else if (isSent) activeStep = 7;
  else if (isPaid) activeStep = 7;
  else if (isValidated) activeStep = 6;
  else if (isComputed) activeStep = 5;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link to="/payruns" className="hover:text-primary transition-colors">
              Payruns
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-mono text-[11px]">{payrun._id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-on-surface">{payrun.name}</h1>
            {getStatusBadge(payrun.status)}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[15px] text-primary">calendar_today</span>
              {pStart} — {pEnd}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">account_tree</span>
              {payrun.salaryStructure?.name || 'Standard Structure'}
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compute Button */}
            {!isValidated && (
              <Button
                variant={payrun.status === 'Draft' ? 'primary' : 'secondary'}
                onClick={handleCompute}
                disabled={actionLoading}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    actionLoading ? 'animate-spin' : ''
                  }`}
                >
                  sync
                </span>
                {payrun.status === 'Draft' ? 'Compute Payrun' : 'Re-compute'}
              </Button>
            )}

            {/* Validate Button */}
            {isComputed && !isValidated && (
              <Button
                variant="primary"
                onClick={handleValidate}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Validate Batch
              </Button>
            )}

            {/* Mark Paid Button */}
            {isValidated && !isPaid && (
              <Button
                variant="primary"
                onClick={handleMarkPaid}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">paid</span>
                Mark as Paid
              </Button>
            )}

            {/* Distribute Payslips Button */}
            {isPaid && !isSent && (
              <Button
                variant="primary"
                onClick={handleSendPayslips}
                disabled={actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                Distribute Payslips
              </Button>
            )}

            {isSent && (
              <div className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                Distributed & Closed
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stitch Design: 7-Stage Payroll Pipeline Stepper */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Deterministic Payroll Engine Pipeline
          </span>
          <span className="text-xs font-semibold text-primary">
            {computingStage ? `Computing Stage ${computingStage} of 7...` : `Stage ${activeStep} of 7 Complete`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PIPELINE_STAGES.map((stage) => {
            const isCompleted = activeStep > stage.id;
            const isCurrent = activeStep === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-primary/5 border-primary/40 shadow-sm ring-2 ring-primary/20'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/60 text-emerald-900'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                        ? 'bg-primary text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-[14px]">{stage.icon}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">0{stage.id}</span>
                </div>

                <div className="mt-3">
                  <div className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
                    {stage.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{stage.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Flight Audit Warning Alerts (if any) */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
            Pre-Flight Computation Audit ({payrun.warnings.length} Notes / Warnings)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {payrun.warnings.map((w, idx) => (
              <div
                key={idx}
                className="bg-white/90 border border-amber-200/80 rounded-xl p-3 text-xs flex items-start gap-2.5"
              >
                <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0 mt-0.5">
                  info
                </span>
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {w.employee ? `${w.employee.firstName} ${w.employee.lastName}: ` : 'Audit: '}
                  </span>
                  <span className="text-slate-600 text-[11px]">{w.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible Staff</span>
          <div className="text-2xl font-bold text-on-surface mt-2">
            {payrun.totals?.employeeCount || payrun.selectedEmployees?.length || 0}
          </div>
          <span className="text-[11px] text-slate-400">Selected in run</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Basic</span>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            ${(payrun.totals?.totalBasic || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">Base salary tier</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Allowances</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            +${(payrun.totals?.totalAllowances || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">HRA, DA, Bonuses</span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions & Tax</span>
          <div className="text-2xl font-bold text-red-600 mt-2">
            -${(payrun.totals?.totalDeductions || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">PF, Tax, Leave cuts</span>
        </div>

        <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl text-white shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Total Net Disbursal</span>
          <div className="text-2xl font-black text-white mt-2">
            ${(payrun.totals?.totalNet || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-indigo-100">Final payout liability</span>
        </div>
      </div>

      {/* Itemized Payslips Table */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface">Calculated Payslip Roster</h3>
            <p className="text-xs text-slate-500">
              {payrun.payslips?.length || 0} individual payroll item records generated
            </p>
          </div>
        </div>

        {!payrun.payslips || payrun.payslips.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">calculate</span>
            <p className="text-sm font-semibold text-slate-600">
              {payrun.status === 'Draft'
                ? 'Click "Compute Payrun" above to run the salary engine on selected employees.'
                : 'No payslips generated for this payrun.'}
            </p>
            {payrun.status === 'Draft' && canManage && (
              <Button variant="primary" onClick={handleCompute} className="mt-4">
                Execute Computation Engine
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5 text-right">Basic Wage</th>
                  <th className="px-5 py-3.5 text-right">Gross Earnings</th>
                  <th className="px-5 py-3.5 text-right">Deductions</th>
                  <th className="px-5 py-3.5 text-right">Net Payable</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payrun.payslips.map((ps, idx) => {
                  const itemKey = ps?._id || (typeof ps === 'string' ? ps : `ps-${idx}`);
                  const emp = ps?.employee;
                  const empName = emp
                    ? typeof emp === 'object'
                      ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee'
                      : 'Employee'
                    : 'Employee';

                  return (
                    <tr key={itemKey} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/10 to-indigo-100 flex items-center justify-center font-bold text-primary text-xs">
                            {emp?.firstName?.[0] || 'E'}
                            {emp?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <span className="font-semibold text-on-surface block text-xs">{empName}</span>
                            <span className="text-[10px] text-slate-400">
                              {emp?.employeeCode || '—'} • {emp?.department || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-xs text-slate-700">
                        ${(ps.basicSalary || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-xs text-slate-800">
                        ${(ps.grossSalary || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-xs text-red-600">
                        -${(ps.totalDeductions || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-sm text-primary">
                        ${(ps.netSalary || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Badge variant={ps.status === 'Paid' ? 'success' : 'purple'}>
                          {ps.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenInspector(ps)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-primary hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
                            title="Inspect Itemized Breakdown"
                          >
                            <span className="material-symbols-outlined text-[16px]">query_stats</span>
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(ps._id, empName)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                            title="Download PDF"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stitch Design: Itemized Payslip Inspector Modal */}
      <Modal
        isOpen={showInspectorModal}
        onClose={() => setShowInspectorModal(false)}
        title="Itemized Salary Rule Inspector"
        size="2xl"
      >
        {selectedPayslip && (
          <div className="space-y-6">
            {/* Payslip Header Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                    Official Salary Computation Audit
                  </span>
                  <h3 className="text-xl font-bold mt-1">
                    {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {selectedPayslip.employee?.employeeCode} • {selectedPayslip.employee?.jobPosition}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-300 block uppercase">Net Disbursed</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ${(selectedPayslip.netSalary || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance & Time-off Meta Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Worked Days</span>
                <span className="text-base font-bold text-slate-800">
                  {selectedPayslip.workedDays || 22} days
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Overtime Hours</span>
                <span className="text-base font-bold text-primary">
                  {selectedPayslip.overtimeHours || 0} hrs
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Unpaid Leaves</span>
                <span className="text-base font-bold text-red-600">
                  {selectedPayslip.unpaidLeaveDays || 0} days
                </span>
              </div>
            </div>

            {/* Rule by Rule Calculation Ledger */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Sequential Rule Computation Trace
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="bg-slate-50 p-3 flex justify-between font-bold text-slate-600">
                  <span>Rule / Component Name</span>
                  <span>Category</span>
                  <span className="text-right">Calculated Value</span>
                </div>

                {selectedPayslip.lineItems?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                    <div>
                      <span className="font-semibold text-on-surface block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.code}</span>
                    </div>
                    <div>
                      <Badge
                        variant={
                          item.category === 'Allowance'
                            ? 'success'
                            : item.category === 'Deduction'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <div
                      className={`font-bold text-sm text-right ${
                        item.category === 'Deduction' ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {item.category === 'Deduction' ? '-' : '+'}
                      ${(item.amount || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleDownloadPDF(
                    selectedPayslip._id,
                    `${selectedPayslip.employee?.firstName}_${selectedPayslip.employee?.lastName}`
                  )
                }
                className="flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Official PDF
              </Button>
              <Button variant="primary" onClick={() => setShowInspectorModal(false)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
