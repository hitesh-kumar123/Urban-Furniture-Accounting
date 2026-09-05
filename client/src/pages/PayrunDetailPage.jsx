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
  { id: 1, name: 'Setup', label: 'Batch Init' },
  { id: 2, name: 'Employees', label: 'Scan Roster' },
  { id: 3, name: 'Compute', label: 'Rules Engine' },
  { id: 4, name: 'Review', label: 'Audit Warnings' },
  { id: 5, name: 'Validate', label: 'Lock Ledger' },
  { id: 6, name: 'Paid', label: 'Settlement' },
  { id: 7, name: 'Delivered', label: 'Dispatched' }
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

  // Inspector Modal
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

  const handleCompute = async () => {
    setActionLoading(true);
    setComputingStage(1);

    const interval = setInterval(() => {
      setComputingStage((prev) => (prev < 6 ? prev + 1 : prev));
    }, 280);

    try {
      const res = await payrunApi.compute(id);
      clearInterval(interval);
      setComputingStage(7);
      if (res.success) {
        showToast('Payroll engine computed successfully', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      clearInterval(interval);
      showToast(err.response?.data?.message || 'Compute failed', 'error');
    } finally {
      setTimeout(() => {
        setComputingStage(null);
        setActionLoading(false);
      }, 400);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.validate(id);
      if (res.success) {
        showToast('Payrun validated and locked', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Validation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.markPaid(id);
      if (res.success) {
        showToast('Payrun marked as Paid', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update payment status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.sendPayslips(id);
      if (res.success) {
        showToast('Digital payslips dispatched to employees', 'success');
        setPayrun(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to distribute payslips', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async (payslipId, empName) => {
    try {
      await payslipApi.downloadPDF(payslipId, `Payslip_${empName?.replace(/\s+/g, '_')}.pdf`);
      showToast('Downloading payslip PDF...', 'info');
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleOpenInspector = (payslip) => {
    setSelectedPayslip(payslip);
    setShowInspectorModal(true);
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

  const canManage = hasRole('Admin', 'HR Payroll Manager');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner message="Loading payrun engine state..." />
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="p-8 text-center bg-[#111114] rounded border border-white/10">
        <h3 className="text-sm font-bold text-[#F5F2EA]">Payrun Not Found</h3>
        <Button variant="primary" onClick={() => navigate('/payruns')} className="mt-4">
          Back to Payruns
        </Button>
      </div>
    );
  }

  const pStart = new Date(payrun.periodStart).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
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

  let activeStep = 1;
  if (computingStage) activeStep = computingStage;
  else if (isSent) activeStep = 7;
  else if (isPaid) activeStep = 6;
  else if (isValidated) activeStep = 5;
  else if (isComputed) activeStep = 3;

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Breadcrumb & Batch Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#6F6C69] mb-1">
            <Link to="/payruns" className="hover:text-[#F5F2EA] transition-colors">
              Payruns
            </Link>
            <span>/</span>
            <span className="text-[#A6A3A0]">{payrun._id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
              {payrun.name}
            </h1>
            {getStatusBadge(payrun.status)}
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-[#A6A3A0] mt-0.5">
            <span>{pStart} — {pEnd}</span>
            <span>•</span>
            <span>{payrun.salaryStructure?.name || 'Standard Structure'}</span>
          </div>
        </div>

        {/* Action Toolbar */}
        {canManage && (
          <div className="flex items-center gap-2">
            {!isValidated && (
              <Button
                variant={payrun.status === 'Draft' ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleCompute}
                disabled={actionLoading}
              >
                <span className={`material-symbols-outlined text-sm ${actionLoading ? 'animate-spin' : ''}`}>
                  sync
                </span>
                {payrun.status === 'Draft' ? 'Compute Payrun' : 'Re-compute'}
              </Button>
            )}

            {isComputed && !isValidated && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleValidate}
                disabled={actionLoading}
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Validate Batch
              </Button>
            )}

            {isValidated && !isPaid && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkPaid}
                disabled={actionLoading}
              >
                <span className="material-symbols-outlined text-sm">paid</span>
                Mark Paid
              </Button>
            )}

            {isPaid && !isSent && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendPayslips}
                disabled={actionLoading}
              >
                <span className="material-symbols-outlined text-sm">forward_to_inbox</span>
                Distribute Payslips
              </Button>
            )}

            {isSent && (
              <div className="px-2.5 py-1 bg-[#39D98A]/10 text-[#39D98A] border border-[#39D98A]/25 rounded text-xs font-mono font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check</span>
                Distributed &amp; Closed
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7-Stage Payroll Pipeline Horizontal Stepper */}
      <div className="midnight-card p-4">
        <div className="flex items-center justify-between mb-3 font-mono text-xs">
          <span className="text-[10px] uppercase tracking-wider text-[#6F6C69] font-bold">
            Payroll Pipeline
          </span>
          <span className="text-[#FF8A65]">
            {computingStage ? `Executing Stage 0${computingStage}...` : `Stage 0${activeStep} of 07`}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 font-mono">
          {PIPELINE_STAGES.map((stage) => {
            const isCompleted = activeStep > stage.id;
            const isCurrent = activeStep === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-2 rounded border transition-all ${
                  isCurrent
                    ? 'bg-[#17171B] border-[#FF6B3D] text-[#F5F2EA]'
                    : isCompleted
                    ? 'bg-[#111114] border-[#39D98A]/30 text-[#39D98A]'
                    : 'bg-[#0B0B0D] border-white/5 text-[#6F6C69]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">0{stage.id}</span>
                  {isCompleted ? (
                    <span className="text-[#39D98A]">✓</span>
                  ) : isCurrent ? (
                    <span className="text-[#FF6B3D]">●</span>
                  ) : (
                    <span className="text-[#6F6C69]">○</span>
                  )}
                </div>
                <div className="text-xs font-semibold mt-1 truncate font-sans">{stage.name}</div>
                <div className="text-[9px] text-[#6F6C69] truncate mt-0.5">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Computation State Live Box (During Execution) */}
      {actionLoading && computingStage && (
        <div className="midnight-card-elevated p-4 font-mono text-xs space-y-2 border-[#FF6B3D]/30">
          <div className="flex items-center gap-2 text-[#FF8A65] font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF6B3D] animate-ping"></span>
            COMPUTING PAYROLL
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="flex items-center justify-between p-2 bg-[#111114] rounded border border-white/5">
              <span>Checking Contracts</span>
              <span className={computingStage >= 1 ? 'text-[#39D98A]' : 'text-[#6F6C69]'}>
                {computingStage >= 1 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111114] rounded border border-white/5">
              <span>Processing Attendance</span>
              <span className={computingStage >= 2 ? 'text-[#39D98A]' : 'text-[#6F6C69]'}>
                {computingStage >= 2 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111114] rounded border border-white/5">
              <span>Applying Leave</span>
              <span className={computingStage >= 3 ? 'text-[#39D98A]' : 'text-[#6F6C69]'}>
                {computingStage >= 3 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111114] rounded border border-white/5">
              <span>Running Salary Rules</span>
              <span className={computingStage >= 4 ? 'text-[#39D98A]' : 'text-[#6F6C69]'}>
                {computingStage >= 4 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111114] rounded border border-white/5">
              <span>Calculating Deductions</span>
              <span className={computingStage >= 5 ? 'text-[#39D98A]' : 'text-[#6F6C69]'}>
                {computingStage >= 5 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#111114] rounded border border-white/5">
              <span>Generating Payslips</span>
              <span className={computingStage >= 6 ? 'text-[#39D98A]' : 'text-[#6F6C69]'}>
                {computingStage >= 6 ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Banner (If present) */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="midnight-card p-4 border-[#F5B942]/30 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#F5B942] font-semibold">
            <span className="material-symbols-outlined text-sm">warning</span>
            REVIEW REQUIRED ({payrun.warnings.length} Audit Notes)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {payrun.warnings.map((w, idx) => (
              <div key={idx} className="p-2.5 bg-[#17171B] rounded border border-white/5 flex items-start gap-2">
                <span className="material-symbols-outlined text-[#F5B942] text-sm shrink-0 mt-0.5">info</span>
                <div>
                  <span className="font-semibold text-[#F5F2EA] block">
                    {w.employee ? `${w.employee.firstName} ${w.employee.lastName}: ` : 'Audit: '}
                  </span>
                  <span className="text-[#A6A3A0] text-[11px]">{w.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Staff Selected</span>
          <div className="text-xl font-bold text-[#F5F2EA] mt-1">
            {payrun.totals?.employeeCount || payrun.selectedEmployees?.length || 0}
          </div>
        </div>

        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Basic Salary</span>
          <div className="text-xl font-bold text-[#F5F2EA] mt-1">
            ${(payrun.totals?.totalBasic || 0).toLocaleString()}
          </div>
        </div>

        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Allowances</span>
          <div className="text-xl font-bold text-[#39D98A] mt-1">
            +${(payrun.totals?.totalAllowances || 0).toLocaleString()}
          </div>
        </div>

        <div className="midnight-card p-3.5">
          <span className="text-[10px] text-[#6F6C69] uppercase block">Deductions</span>
          <div className="text-xl font-bold text-[#FF5C5C] mt-1">
            -${(payrun.totals?.totalDeductions || 0).toLocaleString()}
          </div>
        </div>

        <div className="midnight-card-elevated p-3.5 border-[#FF6B3D]/30">
          <span className="text-[10px] text-[#FF8A65] uppercase block font-bold">Total Net Pay</span>
          <div className="text-xl font-bold text-[#F5F2EA] mt-1">
            ${(payrun.totals?.totalNet || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Calculated Payslip Roster Table */}
      <div className="staffora-table-container">
        <div className="p-3.5 bg-[#0E0E11] border-b border-white/10 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-[#F5F2EA]">
            CALCULATED PAYSLIP ROSTER ({payrun.payslips?.length || 0} Records)
          </span>
        </div>

        {!payrun.payslips || payrun.payslips.length === 0 ? (
          <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
            {payrun.status === 'Draft'
              ? 'Click "Compute Payrun" above to calculate earnings and deductions.'
              : 'No payslips generated.'}
          </div>
        ) : (
          <table className="staffora-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="text-right">Basic</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Deductions</th>
                <th className="text-right">Net Payable</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrun.payslips.map((ps, idx) => {
                const itemKey = ps?._id || (typeof ps === 'string' ? ps : `ps-${idx}`);
                const emp = ps?.employee;
                const empName = emp
                  ? typeof emp === 'object'
                    ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee'
                    : 'Employee'
                  : 'Employee';

                return (
                  <tr key={itemKey}>
                    <td>
                      <div className="font-semibold text-[#F5F2EA]">{empName}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        {emp?.employeeCode || '—'} • {emp?.department || 'General'}
                      </div>
                    </td>

                    <td className="text-right font-mono text-xs text-[#A6A3A0]">
                      ${(ps.basicSalary || 0).toLocaleString()}
                    </td>

                    <td className="text-right font-mono text-xs text-[#F5F2EA]">
                      ${(ps.grossSalary || 0).toLocaleString()}
                    </td>

                    <td className="text-right font-mono text-xs text-[#FF5C5C]">
                      -${(ps.totalDeductions || 0).toLocaleString()}
                    </td>

                    <td className="text-right font-mono font-bold text-xs text-[#39D98A]">
                      ${(ps.netSalary || 0).toLocaleString()}
                    </td>

                    <td className="text-center font-mono">
                      <Badge variant={ps.status === 'Paid' ? 'success' : 'primary'}>
                        {ps.status}
                      </Badge>
                    </td>

                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenInspector(ps)}
                          className="px-2 py-1 bg-[#17171B] hover:bg-[#1E1E24] text-[#FF8A65] border border-white/10 rounded font-mono text-[11px] flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">query_stats</span>
                          Trace
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(ps._id, empName)}
                          className="p-1 bg-[#17171B] hover:bg-[#1E1E24] text-[#A6A3A0] hover:text-[#F5F2EA] border border-white/10 rounded"
                          title="Download PDF"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payslip Formula Trace Inspector Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={showInspectorModal}
          onClose={() => setShowInspectorModal(false)}
          title={`Calculation Trace — ${selectedPayslip.employee?.firstName || ''} ${selectedPayslip.employee?.lastName || 'Employee'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#111114] rounded border border-white/10">
                <span className="text-[9px] text-[#6F6C69] uppercase block">Gross Salary</span>
                <span className="text-sm font-bold text-[#F5F2EA]">
                  ${(selectedPayslip.grossSalary || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#111114] rounded border border-white/10">
                <span className="text-[9px] text-[#6F6C69] uppercase block">Total Deductions</span>
                <span className="text-sm font-bold text-[#FF5C5C]">
                  -${(selectedPayslip.totalDeductions || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#111114] rounded border border-white/10">
                <span className="text-[9px] text-[#6F6C69] uppercase block">Net Disbursed</span>
                <span className="text-sm font-bold text-[#39D98A]">
                  ${(selectedPayslip.netSalary || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-[#6F6C69] uppercase font-bold tracking-wider block">
                Rule-by-Rule Sequential Computation Trace
              </span>
              <div className="border border-white/10 rounded divide-y divide-white/5 bg-[#111114] max-h-60 overflow-y-auto">
                {selectedPayslip.lineItems?.map((li, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#F5F2EA]">{li.name}</span>
                      <span className="text-[10px] text-[#6F6C69] ml-2">
                        [{li.category}]
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#A6A3A0]">
                        {li.rate ? `${li.rate}%` : ''}
                      </span>
                      <span className={`font-bold ${li.category === 'Deduction' ? 'text-[#FF5C5C]' : 'text-[#39D98A]'}`}>
                        {li.category === 'Deduction' ? '-' : '+'}${Number(li.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <Button variant="secondary" onClick={() => setShowInspectorModal(false)}>
                Close Trace
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
