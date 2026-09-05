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
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (employeeFilter) params.employee = employeeFilter;
      const [psRes, empRes] = await Promise.all([
        payslipApi.getAll(params),
        employeeApi.getAll()
      ]);

      if (psRes.success) setPayslips(psRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (err) {
      showToast('Failed to load payslips', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [employeeFilter]);

  const handleDownloadPDF = async (payslip) => {
    setDownloadingId(payslip._id);
    const empName = payslip.employee ? `${payslip.employee.firstName}_${payslip.employee.lastName}` : 'Staff';
    try {
      await payslipApi.downloadPDF(payslip._id, `Payslip_${empName}.pdf`);
      showToast('Payslip PDF downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to generate PDF download', 'error');
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
      showToast('Failed to dispatch email', 'error');
    }
  };

  const canManageAll = hasRole('Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User');

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Payroll Ledger
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Digital Payslip Vault ({payslips.length})
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Certified digital payslips, itemized calculation traces, and vector PDF downloads.
          </p>
        </div>

        {canManageAll && (
          <div className="flex items-center gap-2.5">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
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
          <div className="p-10 text-center text-[#6F6C69] font-mono text-xs">
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
                      <div className="font-semibold text-[#F5F2EA]">{empName}</div>
                      <div className="text-[10px] font-mono text-[#6F6C69]">
                        {ps.employee?.employeeId || ps.employee?.jobPosition || 'Staff'} • {ps.payrun?.name || 'Payrun Batch'}
                      </div>
                    </td>

                    <td className="font-mono text-xs text-[#A6A3A0]">
                      {pStart} — {pEnd}
                    </td>

                    <td className="text-right font-mono text-xs text-[#F5F2EA]">
                      ₹{Number(grossAmt).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono text-xs text-[#FF5C5C]">
                      -₹{Number(dedAmt).toLocaleString('en-IN')}
                    </td>

                    <td className="text-right font-mono font-bold text-xs text-[#39D98A]">
                      ₹{Number(netAmt).toLocaleString('en-IN')}
                    </td>

                    <td className="text-center font-mono">
                      <Badge variant={ps.status === 'Paid' ? 'success' : 'primary'}>
                        {ps.status}
                      </Badge>
                    </td>

                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPayslip(ps);
                            setShowInspectorModal(true);
                          }}
                          className="px-2 py-0.5 bg-[#17171B] hover:bg-[#1E1E24] text-[#FF8A65] border border-white/10 rounded text-[11px] font-mono"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(ps)}
                          disabled={downloadingId === ps._id}
                          className="p-1 bg-[#17171B] hover:bg-[#1E1E24] text-[#A6A3A0] hover:text-[#F5F2EA] border border-white/10 rounded"
                          title="Download PDF"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                        </button>
                        {canManageAll && (
                          <button
                            onClick={() => handleSendEmail(ps._id)}
                            className="p-1 bg-[#17171B] hover:bg-[#1E1E24] text-[#A6A3A0] hover:text-[#F5F2EA] border border-white/10 rounded"
                            title="Dispatch Email"
                          >
                            <span className="material-symbols-outlined text-[14px]">mail</span>
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
              <div className="bg-[#111114] p-4 rounded border border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">NET PAYABLE SALARY</span>
                  <div className="text-3xl font-bold text-[#39D98A] font-mono-val mt-0.5">
                    ₹{Number(netAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  {pStart && pEnd && (
                    <span className="text-[10px] text-[#A6A3A0] block mt-1">
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
                <div className="p-2.5 bg-[#111114] rounded border border-white/5">
                  <span className="text-[9px] uppercase text-[#6F6C69] block">Gross Earnings</span>
                  <span className="text-sm font-bold text-[#F5F2EA]">₹{Number(grossAmt).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2.5 bg-[#111114] rounded border border-white/5">
                  <span className="text-[9px] uppercase text-[#6F6C69] block">Total Deductions</span>
                  <span className="text-sm font-bold text-[#FF5C5C]">-₹{Number(dedAmt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-[#6F6C69] font-bold block">
                  Itemized Salary Breakdown ({items.length} Rules)
                </span>
                <div className="border border-white/10 rounded divide-y divide-white/5 bg-[#111114] max-h-64 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-[#6F6C69] text-xs">
                      No itemized lines recorded.
                    </div>
                  ) : (
                    items.map((li, idx) => {
                      const isDeduction = li.category === 'Deductions' || li.category === 'Deduction';
                      const isNetOrGross = li.category === 'Gross' || li.category === 'Net';

                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className={`font-semibold ${isNetOrGross ? 'text-[#F5F2EA] font-bold' : 'text-[#D0CDC7]'}`}>
                              {li.name || li.code}
                            </span>
                            <span className="text-[10px] text-[#6F6C69] ml-2 font-mono">
                              [{li.category}]
                            </span>
                          </div>
                          <span
                            className={`font-bold ${
                              isDeduction
                                ? 'text-[#FF5C5C]'
                                : isNetOrGross
                                ? 'text-[#F5F2EA]'
                                : 'text-[#39D98A]'
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

              <div className="flex justify-between items-center pt-3 border-t border-white/10">
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
