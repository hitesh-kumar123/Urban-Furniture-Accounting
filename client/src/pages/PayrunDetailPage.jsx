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

  // Inspector Modal & Warning Confirmation Modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null, // 'validate' | 'markPaid'
    title: '',
    message: ''
  });

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

  const executeValidate = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.validate(id);
      if (res.success) {
        showToast('Payrun validated and locked', 'success');
        setPayrun(res.data);
        setConfirmModal({ isOpen: false, actionType: null, title: '', message: '' });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Validation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = () => {
    const nonCritical = (payrun.warnings || []).filter((w) => w.level !== 'Critical');
    if (nonCritical.length > 0) {
      setConfirmModal({
        isOpen: true,
        actionType: 'validate',
        title: 'Confirm Payrun Validation',
        message: `This payrun has ${nonCritical.length} audit note(s) (such as missing bank details). Are you sure you want to validate and lock this payroll batch?`
      });
    } else {
      executeValidate();
    }
  };

  const executeMarkPaid = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.markPaid(id);
      if (res.success) {
        showToast('Payrun marked as Paid', 'success');
        setPayrun(res.data);
        setConfirmModal({ isOpen: false, actionType: null, title: '', message: '' });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update payment status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = () => {
    if (payrun.warnings && payrun.warnings.length > 0) {
      setConfirmModal({
        isOpen: true,
        actionType: 'markPaid',
        title: 'Confirm Payment Disbursal',
        message: `This payrun has ${payrun.warnings.length} audit note(s). Are you sure you want to execute settlement and mark all payslips as Paid?`
      });
    } else {
      executeMarkPaid();
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
      <div className="p-8 text-center bg-white rounded-xl border border-[#E7E2D9]">
        <h3 className="text-sm font-bold text-[#1C1B19]">Payrun Not Found</h3>
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Breadcrumb & Batch Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#6B665C] mb-1">
            <Link to="/payruns" className="hover:text-[#1C1B19] transition-colors">
              Payruns
            </Link>
            <span>/</span>
            <span className="text-[#918C82]">{payrun._id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
              {payrun.name}
            </h1>
            {getStatusBadge(payrun.status)}
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-[#6B665C] mt-0.5">
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
              <div className="px-3 py-1.5 bg-[#E8F4F1] text-[#0F5C4A] border border-[#0F5C4A]/25 rounded-md text-xs font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check</span>
                Distributed &amp; Closed
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7-Stage Payroll Pipeline Horizontal Stepper */}
      <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-xs uppercase tracking-wider text-[#6B665C] font-semibold">
            Payroll Pipeline
          </span>
          <span className="text-[#0F5C4A] font-mono font-medium">
            {computingStage ? `Executing Stage 0${computingStage}...` : `Stage 0${activeStep} of 07`}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {PIPELINE_STAGES.map((stage) => {
            const isCompleted = activeStep > stage.id;
            const isCurrent = activeStep === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-[#E8F4F1] border-[#0F5C4A] text-[#0F5C4A] font-semibold'
                    : isCompleted
                    ? 'bg-white border-[#0F5C4A]/30 text-[#0F5C4A]'
                    : 'bg-[#FAF9F6] border-[#E7E2D9] text-[#918C82]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold">0{stage.id}</span>
                  {isCompleted ? (
                    <span className="text-[#0F5C4A] font-bold">✓</span>
                  ) : isCurrent ? (
                    <span className="text-[#0F5C4A]">●</span>
                  ) : (
                    <span className="text-[#918C82]">○</span>
                  )}
                </div>
                <div className="text-xs font-medium mt-1 truncate">{stage.name}</div>
                <div className="text-[10px] text-[#6B665C] truncate mt-0.5">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Computation State Live Box (During Execution) */}
      {actionLoading && computingStage && (
        <div className="bg-white rounded-xl border border-[#0F5C4A]/30 p-4 text-xs space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-[#0F5C4A] font-semibold text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#0F5C4A] animate-ping"></span>
            COMPUTING PAYROLL ENGINE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
              <span>Checking Contracts</span>
              <span className={computingStage >= 1 ? 'text-[#0F5C4A] font-bold' : 'text-[#918C82]'}>
                {computingStage >= 1 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
              <span>Processing Attendance</span>
              <span className={computingStage >= 2 ? 'text-[#0F5C4A] font-bold' : 'text-[#918C82]'}>
                {computingStage >= 2 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
              <span>Applying Leave</span>
              <span className={computingStage >= 3 ? 'text-[#0F5C4A] font-bold' : 'text-[#918C82]'}>
                {computingStage >= 3 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
              <span>Running Salary Rules</span>
              <span className={computingStage >= 4 ? 'text-[#0F5C4A] font-bold' : 'text-[#918C82]'}>
                {computingStage >= 4 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
              <span>Calculating Deductions</span>
              <span className={computingStage >= 5 ? 'text-[#0F5C4A] font-bold' : 'text-[#918C82]'}>
                {computingStage >= 5 ? '✓' : '○'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded border border-[#E7E2D9]">
              <span>Generating Payslips</span>
              <span className={computingStage >= 6 ? 'text-[#0F5C4A] font-bold' : 'text-[#918C82]'}>
                {computingStage >= 6 ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Banner (If present) */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <div className="bg-[#FDF1EE] rounded-xl p-4 border border-[#B5482E]/30 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#B5482E] font-semibold">
            <span className="material-symbols-outlined text-base">warning</span>
            Review Required ({payrun.warnings.length} Audit Notes)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {payrun.warnings.map((w, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-lg border border-[#B5482E]/20 flex items-start gap-2">
                <span className="material-symbols-outlined text-[#B5482E] text-sm shrink-0 mt-0.5">info</span>
                <div>
                  <span className="font-medium text-[#1C1B19] block">
                    {w.employee ? `${w.employee.firstName} ${w.employee.lastName}: ` : 'Audit: '}
                  </span>
                  <span className="text-[#6B665C] text-xs">{w.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-3.5 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block">Staff Selected</span>
          <div className="text-xl font-bold text-[#1C1B19] font-mono mt-1">
            {payrun.totals?.employeeCount || payrun.selectedEmployees?.length || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E7E2D9] p-3.5 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block">Basic Salary</span>
          <div className="text-xl font-bold text-[#1C1B19] font-mono mt-1">
            ₹{(payrun.totals?.totalBasic || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E7E2D9] p-3.5 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block">Allowances</span>
          <div className="text-xl font-bold text-[#0F5C4A] font-mono mt-1">
            +₹{(payrun.totals?.totalAllowances || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E7E2D9] p-3.5 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase block">Deductions</span>
          <div className="text-xl font-bold text-[#B5482E] font-mono mt-1">
            -₹{(payrun.totals?.totalDeductions || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-[#FAF4E8] rounded-xl border border-[#8A6D3B]/30 p-3.5 shadow-sm">
          <span className="text-xs text-[#8A6D3B] uppercase block font-semibold">Total Net Pay</span>
          <div className="text-xl font-bold text-[#8A6D3B] font-mono mt-1">
            ₹{(payrun.totals?.totalNet || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Calculated Payslip Roster Table */}
      <div className="staffora-table-container">
        <div className="p-3.5 bg-[#FAF9F6] border-b border-[#E7E2D9] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1C1B19]">
            Calculated Payslip Roster ({payrun.payslips?.length || 0} Records)
          </span>
        </div>

        {!payrun.payslips || payrun.payslips.length === 0 ? (
          <div className="p-10 text-center text-[#6B665C] text-xs">
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
                      <div className="font-medium text-[#1C1B19]">{empName}</div>
                      <div className="text-xs font-mono text-[#6B665C]">
                        {emp?.employeeId || emp?.jobPosition || 'Staff'} • {emp?.department || 'General'}
                      </div>
                    </td>

                    <td className="text-right font-mono text-xs text-[#6B665C]">
                      ₹{(ps.basicSalary || ps.basic || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono text-xs text-[#1C1B19]">
                      ₹{(ps.grossSalary || ps.gross || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono text-xs text-[#B5482E]">
                      -₹{(ps.totalDeductions || ps.deductions || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono font-bold text-xs text-[#0F5C4A]">
                      ₹{(ps.netSalary || ps.net || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="text-center">
                      <Badge variant={ps.status === 'Paid' ? 'success' : 'primary'}>
                        {ps.status}
                      </Badge>
                    </td>

                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenInspector(ps)}
                          className="px-2.5 py-1 bg-white hover:bg-[#FAF9F6] text-[#0F5C4A] border border-[#E7E2D9] rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">query_stats</span>
                          Trace
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(ps._id, empName)}
                          className="p-1.5 bg-white hover:bg-[#FAF9F6] text-[#6B665C] hover:text-[#1C1B19] border border-[#E7E2D9] rounded-md transition-colors"
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
      {selectedPayslip && (() => {
        const items = selectedPayslip.ruleBreakdown || selectedPayslip.lineItems || [];
        const grossAmt = selectedPayslip.gross !== undefined ? selectedPayslip.gross : (selectedPayslip.grossSalary || 0);
        const dedAmt = selectedPayslip.deductions !== undefined ? selectedPayslip.deductions : (selectedPayslip.totalDeductions || 0);
        const netAmt = selectedPayslip.net !== undefined ? selectedPayslip.net : (selectedPayslip.netSalary || 0);

        return (
          <Modal
            isOpen={showInspectorModal}
            onClose={() => setShowInspectorModal(false)}
            title={`Calculation Trace — ${selectedPayslip.employee?.firstName || ''} ${selectedPayslip.employee?.lastName || 'Employee'}`}
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9]">
                  <span className="text-[10px] text-[#6B665C] uppercase block font-medium">Gross Salary</span>
                  <span className="text-sm font-bold text-[#1C1B19]">
                    ₹{Number(grossAmt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9]">
                  <span className="text-[10px] text-[#6B665C] uppercase block font-medium">Total Deductions</span>
                  <span className="text-sm font-bold text-[#B5482E]">
                    -₹{Number(dedAmt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF4E8] rounded-lg border border-[#8A6D3B]/30">
                  <span className="text-[10px] text-[#8A6D3B] uppercase block font-semibold">Net Disbursed</span>
                  <span className="text-sm font-bold text-[#8A6D3B]">
                    ₹{Number(netAmt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-[#6B665C] font-semibold block">
                  Rule-by-Rule Sequential Computation Trace ({items.length} Rules)
                </span>
                <div className="border border-[#E7E2D9] rounded-lg divide-y divide-[#E7E2D9] bg-white max-h-60 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-[#6B665C] text-xs">
                      No trace line items available.
                    </div>
                  ) : (
                    items.map((li, idx) => {
                      const isDeduction = li.category === 'Deductions' || li.category === 'Deduction';
                      const isNetOrGross = li.category === 'Gross' || li.category === 'Net';

                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className={`font-semibold ${isNetOrGross ? 'text-[#1C1B19]' : 'text-[#6B665C]'}`}>
                              {li.name || li.code}
                            </span>
                            <span className="text-[10px] text-[#918C82] ml-2">
                              [{li.category}]
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#6B665C]">
                              {li.formulaOrBase || (li.rate ? `${li.rate}%` : '')}
                            </span>
                            <span
                              className={`font-bold font-mono ${
                                isDeduction
                                  ? 'text-[#B5482E]'
                                  : isNetOrGross
                                  ? 'text-[#1C1B19]'
                                  : 'text-[#0F5C4A]'
                              }`}
                            >
                              {isDeduction ? '-' : '+'}₹{Number(li.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#E7E2D9]">
                <Button variant="secondary" onClick={() => setShowInspectorModal(false)}>
                  Close Trace
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Audit Warning Confirmation Modal */}
      {confirmModal.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, actionType: null, title: '', message: '' })}
          title={confirmModal.title}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#FDF1EE] border border-[#B5482E]/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-[#B5482E] font-semibold text-xs">
                <span className="material-symbols-outlined text-base">warning</span>
                <span>Active Audit Warnings Detected</span>
              </div>
              <p className="text-[#6B665C] text-xs leading-relaxed">
                {confirmModal.message}
              </p>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {(payrun.warnings || []).map((w, idx) => (
                <div key={idx} className="p-2 bg-[#FAF9F6] border border-[#E7E2D9] rounded-md text-xs flex items-start gap-2">
                  <span className={`material-symbols-outlined text-xs mt-0.5 ${w.level === 'Critical' ? 'text-[#B5482E]' : 'text-[#8A6D3B]'}`}>
                    {w.level === 'Critical' ? 'error' : 'info'}
                  </span>
                  <span className="text-[#1C1B19]">{w.message}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal({ isOpen: false, actionType: null, title: '', message: '' })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmModal.actionType === 'validate' ? executeValidate : executeMarkPaid}
                loading={actionLoading}
              >
                Confirm &amp; Proceed
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
