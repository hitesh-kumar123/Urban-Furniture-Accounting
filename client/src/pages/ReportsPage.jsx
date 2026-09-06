import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { payrunApi } from '../api/payrunApi';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, payrunsRes] = await Promise.all([
        dashboardApi.getPayrollMetrics({ department: departmentFilter || undefined }),
        payrunApi.getAll()
      ]);

      if (metricsRes.success) setData(metricsRes.data);
      if (payrunsRes.success) setPayruns(payrunsRes.data);
    } catch (err) {
      showToast('Failed to load analytical reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentFilter]);

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push(['Employee Code', 'Full Name', 'Department', 'Job Position', 'Basic Salary', 'Gross Salary', 'Total Deductions', 'Net Salary', 'Pay Period', 'Status'].join(','));

    // Flatten payslips from settled payruns
    const allPayslips = [];
    payruns.forEach((p) => {
      if (p.payslips && Array.isArray(p.payslips)) {
        p.payslips.forEach((ps) => {
          allPayslips.push({
            ...ps,
            payrunName: p.name,
            period: `${p.periodStart?.split('T')[0]} to ${p.periodEnd?.split('T')[0]}`
          });
        });
      }
    });

    if (allPayslips.length === 0) {
      showToast('No calculated payslip records available for export', 'warning');
      return;
    }

    allPayslips.forEach((ps) => {
      const emp = ps.employee || {};
      const net = ps.net !== undefined ? ps.net : (ps.netSalary || 0);
      const gross = ps.gross !== undefined ? ps.gross : (ps.grossSalary || 0);
      const ded = ps.deductions !== undefined ? ps.deductions : (ps.totalDeductions || 0);
      const basic = ps.basic !== undefined ? ps.basic : (ps.basicSalary || 0);

      csvRows.push([
        `"${emp.employeeId || 'EMP'}"`,
        `"${emp.firstName || ''} ${emp.lastName || ''}".trim()`,
        `"${emp.department || 'General'}"`,
        `"${emp.jobPosition || 'Staff'}"`,
        basic,
        gross,
        ded,
        net,
        `"${ps.period || 'Current'}"`,
        `"${ps.status || 'Paid'}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Staffora_Payroll_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Payroll ledger CSV exported successfully', 'success');
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner message="Generating executive intelligence reports..." />
      </div>
    );
  }

  const formatMonthName = (raw) => {
    if (!raw) return '';
    if (typeof raw === 'string' && /^\d{4}-\d{2}$/.test(raw)) {
      const [year, month] = raw.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return String(raw);
  };

  const deptCosts = data?.payroll?.salaryCostByDepartment || [];
  const rawMonthlyTrends = data?.payroll?.monthlyTrends || [];
  const monthlyTrends = rawMonthlyTrends.map((m) => ({
    ...m,
    month: formatMonthName(m.month),
    totalNet: m.totalNet || m.netSalary || 0
  }));
  const rawMaxNet = Math.max(...monthlyTrends.map((m) => m.totalNet || 0), 10000);
  const maxNet = rawMaxNet > 0 ? rawMaxNet * 1.25 : 10000;
  const maxDeptCost = Math.max(...deptCosts.map((d) => d.totalCost || 0), 10000);

  const totalNetPaid = data?.payroll?.totalNetPaid || 0;
  const totalHeadcount = data?.headcount?.total || 0;
  const paidBatchesCount = payruns.filter((p) => p.status === 'Paid' || p.status === 'PayslipsSent').length;

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Executive Analytics
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            Reports &amp; Workforce Intelligence
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            Financial auditing records, department liabilities, and exportable payroll ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            icon="file_download"
          >
            Export Ledger (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAF4E8] rounded-xl border border-[#8A6D3B]/30 p-4 space-y-1 shadow-sm">
          <span className="text-xs text-[#8A6D3B] uppercase font-semibold block">
            Annual Net Payroll Disbursal
          </span>
          <div className="text-2xl font-bold text-[#8A6D3B] font-mono">
            ₹{Number(totalNetPaid).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#8A6D3B]">Aggregated across all settled cycles</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase font-medium block">
            Total Active Headcount
          </span>
          <div className="text-2xl font-bold text-[#1C1B19] font-mono">
            {totalHeadcount} Staff
          </div>
          <span className="text-xs text-[#6B665C]">Active contractual roster</span>
        </div>

        <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 space-y-1 shadow-sm">
          <span className="text-xs text-[#6B665C] uppercase font-medium block">
            Settled Payrun Batches
          </span>
          <div className="text-2xl font-bold text-[#0F5C4A] font-mono">
            {paidBatchesCount} of {payruns.length} Batches
          </div>
          <span className="text-xs text-[#6B665C]">Historical audited pay periods</span>
        </div>
      </div>

      {/* Trajectory & Department Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Trajectory */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-[#E7E2D9]">
            <h3 className="text-sm font-heading font-medium text-[#1C1B19]">Net Payout Historical Trajectory</h3>
            <span className="font-mono text-xs text-[#6B665C]">Trailing Months</span>
          </div>

          {monthlyTrends.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-[#FAF9F6] border border-dashed border-[#E7E2D9] rounded-lg">
              <span className="material-symbols-outlined text-2xl text-[#918C82] mb-1">query_stats</span>
              <p className="text-xs font-semibold text-[#1C1B19]">No Historical Records</p>
              <p className="text-xs text-[#6B665C] mt-0.5">
                Trajectory will appear after your first settled payroll cycle.
              </p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {monthlyTrends.map((m, idx) => {
                const val = m.totalNet || m.netSalary || 0;
                const heightPercent = Math.min(100, Math.max(16, Math.round((val / maxNet) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 font-mono">
                    <span className="text-[10px] text-[#6B665C]">₹{Math.round(val / 1000)}k</span>
                    <div className="w-full bg-[#FAF9F6] rounded-t h-28 flex items-end p-0.5 border border-[#E7E2D9]">
                      <div
                        className="w-full rounded-t bg-[#0F5C4A] hover:bg-[#0F5C4A]/80 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                        title={`${m.month}: ₹${Number(val).toLocaleString('en-IN')}`}
                      />
                    </div>
                    <span className="text-xs text-[#6B665C]">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Costs */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E7E2D9] p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-[#E7E2D9]">
            <h3 className="text-sm font-heading font-medium text-[#1C1B19]">Department Cost Breakdown</h3>
          </div>

          <div className="space-y-3">
            {deptCosts.length === 0 ? (
              <div className="p-4 text-center text-[#6B665C] text-xs">
                No department cost logs recorded.
              </div>
            ) : (
              deptCosts.map((d) => (
                <div key={d.department} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#1C1B19] font-medium">{d.department} ({d.employeeCount || 1} staff)</span>
                    <span className="text-[#8A6D3B] font-mono font-bold">₹{Number(d.totalCost || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E7E2D9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F5C4A]"
                      style={{ width: `${Math.min(100, Math.round(((d.totalCost || 0) / maxDeptCost) * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
