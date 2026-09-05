import React, { useState, useEffect } from 'react';
import { payslipApi } from '../api/payslipApi';
import { employeeApi } from '../api/employeeApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PayslipsPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Clean Trace / Payslip View Modal
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.role === 'Employee' && user?.employee) {
        params.employee = user.employee;
      } else if (employeeFilter) {
        params.employee = employeeFilter;
      }

      const res = await payslipApi.getAll(params);
      if (res.success) {
        setPayslips(res.data);
      }
    } catch (err) {
      showToast('Failed to load payslips archive', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (user?.role !== 'Employee') {
      try {
        const res = await employeeApi.getAll();
        if (res.success) setEmployees(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchPayslips();
    fetchEmployees();
  }, [employeeFilter]);

  const handleDownloadPDF = async (ps) => {
    setDownloadingId(ps._id);
    const empName = ps.employee?.firstName ? `${ps.employee.firstName}_${ps.employee.lastName}` : 'Employee';
    try {
      await payslipApi.downloadPDF(ps._id, `Payslip_${empName}_${ps._id.slice(-6)}.pdf`);
      showToast('Certified PDF download initiated', 'success');
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSendEmail = async (id) => {
    try {
      const res = await payslipApi.sendEmail(id);
      if (res.success) {
        showToast('Payslip email dispatched to employee', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Email dispatch failed', 'error');
    }
  };

  const canManageAll = hasRole('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Payroll Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Digital Payslip Vault ({payslips.length})
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Certified digital payslips, itemized calculation traces, and vector PDF downloads.
          </p>
        </div>

        {canManageAll && (
          <div className="flex items-center gap-2.5">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeId || e.jobPosition || 'Staff'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Payslips Table */}
      <div className="staffora-table-container">
        {loading ? (
          <LoadingSpinner message="Scanning payslip vault..." />
        ) : payslips.length === 0 ? (
          <div className="p-10 text-center text-[#6B665C] text-xs">
            No payslips found.
          </div>
        ) : (
          <table className="staffora-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Pay Period</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Deductions</th>
                <th className="text-right">Net Salary</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((ps) => {
                const empName = ps.employee
                  ? typeof ps.employee === 'object'
                    ? `${ps.employee.firstName || ''} ${ps.employee.lastName || ''}`.trim()
                    : 'Employee'
                  : 'Employee';
                const pStartRaw = ps.payrollPeriod?.start || ps.periodStart;
                const pEndRaw = ps.payrollPeriod?.end || ps.periodEnd;
                const pStart = pStartRaw ? new Date(pStartRaw).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                const pEnd = pEndRaw ? new Date(pEndRaw).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                const netAmt = ps.net !== undefined ? ps.net : (ps.netSalary || 0);
                const grossAmt = ps.gross !== undefined ? ps.gross : (ps.grossSalary || 0);
                const dedAmt = ps.deductions !== undefined ? ps.deductions : (ps.totalDeductions || 0);

                return (
                  <tr key={ps._id}>
                    <td>
                      <div className="font-medium text-[#1C1B19]">{empName}</div>
                      <div className="text-[11px] font-mono text-[#6B665C]">
                        {ps.employee?.employeeId || ps.employee?.jobPosition || 'Staff'} • {ps.payrun?.name || 'Payrun Batch'}
                      </div>
                    </td>

                    <td className="font-mono text-xs text-[#6B665C]">
                      {pStart} — {pEnd}
                    </td>

                    <td className="text-right font-mono text-xs text-[#1C1B19]">
                      ₹{Number(grossAmt).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono text-xs text-[#B5482E]">
                      -₹{Number(dedAmt).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono font-bold text-xs text-[#8A6D3B]">
                      ₹{Number(netAmt).toLocaleString('en-IN')}
                    </td>

                    <td className="text-center">
                      <Badge variant={ps.status === 'Paid' ? 'success' : 'primary'}>
                        {ps.status}
                      </Badge>
                    </td>

                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPayslip(ps);
                            setShowInspectorModal(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-[#FAF9F6] text-[#0F5C4A] border border-[#E7E2D9] rounded-md text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(ps)}
                          disabled={downloadingId === ps._id}
                          className="p-1.5 bg-white hover:bg-[#FAF9F6] text-[#6B665C] hover:text-[#1C1B19] border border-[#E7E2D9] rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                        {canManageAll && (
                          <button
                            onClick={() => handleSendEmail(ps._id)}
                            className="p-1.5 bg-white hover:bg-[#FAF9F6] text-[#6B665C] hover:text-[#1C1B19] border border-[#E7E2D9] rounded-md transition-colors"
                            title="Dispatch Email"
                          >
                            <span className="material-symbols-outlined text-sm">mail</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payslip Clean View Modal */}
      {selectedPayslip && (() => {
        const netAmt = selectedPayslip.net !== undefined ? selectedPayslip.net : (selectedPayslip.netSalary || 0);
        const grossAmt = selectedPayslip.gross !== undefined ? selectedPayslip.gross : (selectedPayslip.grossSalary || 0);
        const dedAmt = selectedPayslip.deductions !== undefined ? selectedPayslip.deductions : (selectedPayslip.totalDeductions || 0);
        const items = selectedPayslip.ruleBreakdown || selectedPayslip.lineItems || [];
        const pStartRaw = selectedPayslip.payrollPeriod?.start || selectedPayslip.periodStart;
        const pEndRaw = selectedPayslip.payrollPeriod?.end || selectedPayslip.periodEnd;
        const pStart = pStartRaw ? new Date(pStartRaw).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const pEnd = pEndRaw ? new Date(pEndRaw).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        return (
          <Modal
            isOpen={showInspectorModal}
            onClose={() => setShowInspectorModal(false)}
            title={`Digital Payslip — ${selectedPayslip.employee?.firstName || ''} ${selectedPayslip.employee?.lastName || 'Employee'}`}
            maxWidth="max-w-xl"
          >
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#FAF4E8] p-4 rounded-xl border border-[#8A6D3B]/30 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#8A6D3B] uppercase font-semibold block">NET PAYABLE SALARY</span>
                  <div className="text-3xl font-bold text-[#8A6D3B] font-mono mt-0.5">
                    ₹{Number(netAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  {pStart && pEnd && (
                    <span className="text-xs text-[#8A6D3B] block mt-1">
                      Period: {pStart} — {pEnd}
                    </span>
                  )}
                </div>
                <Badge variant={selectedPayslip.status === 'Paid' ? 'success' : 'primary'}>
                  {selectedPayslip.status}
                </Badge>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E7E2D9]">
                  <span className="text-[10px] uppercase text-[#6B665C] block font-medium">Gross Earnings</span>
                  <span className="text-base font-bold text-[#1C1B19]">₹{Number(grossAmt).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E7E2D9]">
                  <span className="text-[10px] uppercase text-[#6B665C] block font-medium">Total Deductions</span>
                  <span className="text-base font-bold text-[#B5482E]">-₹{Number(dedAmt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-[#6B665C] font-semibold block">
                  Itemized Salary Breakdown ({items.length} Rules)
                </span>
                <div className="border border-[#E7E2D9] rounded-lg divide-y divide-[#E7E2D9] bg-white max-h-64 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-[#6B665C] text-xs">
                      No itemized lines recorded.
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
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#E7E2D9]">
                <Button
                  variant="primary"
                  onClick={() => handleDownloadPDF(selectedPayslip)}
                  icon="download"
                >
                  Download PDF
                </Button>
                <Button variant="secondary" onClick={() => setShowInspectorModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
