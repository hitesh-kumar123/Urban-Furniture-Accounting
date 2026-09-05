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
      // If employee only, API automatically scopes or we can filter
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Digital Payslip Vault</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access certified digital payslips, itemized calculation traces, and statutory tax records.
          </p>
        </div>
      </div>

      {/* Filter Toolbar (if manager) */}
      {canManageAll && (
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Filter by Employee:</span>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </select>
            {employeeFilter && (
              <button
                onClick={() => setEmployeeFilter('')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payslip Table */}
      <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : payslips.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
            <p className="text-sm font-semibold text-slate-600">No payslips available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Pay Period</th>
                  <th className="px-5 py-3.5 text-right">Gross Salary</th>
                  <th className="px-5 py-3.5 text-right">Deductions</th>
                  <th className="px-5 py-3.5 text-right">Net Payable</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payslips.map((ps, idx) => {
                  const itemKey = ps?._id || (typeof ps === 'string' ? ps : `ps-${idx}`);
                  const emp = ps.employee;
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';
                  const pStart = ps.payrun?.periodStart
                    ? new Date(ps.payrun.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : '—';
                  const pEnd = ps.payrun?.periodEnd
                    ? new Date(ps.payrun.periodEnd).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : '—';

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

                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {pStart} — {pEnd}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-xs text-slate-700">
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
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedPayslip(ps);
                              setShowInspectorModal(true);
                            }}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDownloadPDF(ps)}
                            disabled={downloadingId === ps._id}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">download</span>
                            PDF
                          </Button>
                          {canManageAll && (
                            <button
                              onClick={() => handleSendEmail(ps._id)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs"
                              title="Email Payslip"
                            >
                              <span className="material-symbols-outlined text-[15px]">send</span>
                            </button>
                          )}
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

      {/* Payslip Inspector Modal */}
      <Modal
        isOpen={showInspectorModal}
        onClose={() => setShowInspectorModal(false)}
        title="Official Payslip Statement"
        size="2xl"
      >
        {selectedPayslip && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                    STAFFORA SALARY SLIP
                  </span>
                  <h3 className="text-2xl font-bold mt-1">
                    {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {selectedPayslip.employee?.jobPosition} • Code: {selectedPayslip.employee?.employeeCode}
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

            {/* Line Items Grid */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              <div className="bg-slate-50 p-3 flex justify-between font-bold text-slate-600">
                <span>Earning / Deduction Component</span>
                <span>Category</span>
                <span className="text-right">Amount</span>
              </div>
              {selectedPayslip.lineItems?.map((item, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">({item.code})</span>
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
                    className={`font-bold text-sm ${
                      item.category === 'Deduction' ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {item.category === 'Deduction' ? '-' : '+'}
                    ${(item.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={() => handleDownloadPDF(selectedPayslip)}
                className="flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Official PDF
              </Button>
              <Button variant="secondary" onClick={() => setShowInspectorModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
