import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { payrunApi } from '../api/payrunApi';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [dashRes, pRes] = await Promise.all([
          dashboardApi.getStats(),
          payrunApi.getAll()
        ]);
        if (dashRes.success) setData(dashRes.data);
        if (pRes.success) setPayruns(pRes.data);
      } catch (err) {
        showToast('Failed to load payroll reporting intelligence', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!payruns || payruns.length === 0) {
      showToast('No payrun data available to export', 'warning');
      return;
    }

    const headers = ['Payrun Name', 'Period Start', 'Period End', 'Status', 'Employees', 'Gross', 'Deductions', 'Net'];
    const rows = payruns.map((p) => [
      `"${p.name}"`,
      p.periodStart?.split('T')[0],
      p.periodEnd?.split('T')[0],
      p.status,
      p.totals?.employeeCount || p.selectedEmployees?.length || 0,
      p.totals?.totalGross || 0,
      p.totals?.totalDeductions || 0,
      p.totals?.totalNet || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staffora_Payroll_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payroll ledger CSV exported successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const deptCosts = data?.departmentCosts || [];
  const monthlyTrends = data?.monthlyTrend || [];
  const maxNet = Math.max(...monthlyTrends.map((m) => m.netSalary || 0), 10000);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Reports & Payroll Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Executive financial audit reports, workforce allocation, and statutory compliance intelligence.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleExportCSV}
          className="flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">file_download</span>
          Export Full Ledger (CSV)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual Net Payroll Liability</span>
          <div className="text-3xl font-bold text-on-surface mt-2">
            ${(data?.metrics?.totalNetPayroll || 0).toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
            Disbursed across {payruns.length} pay batches
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Headcount</span>
          <div className="text-3xl font-bold text-primary mt-2">
            {data?.metrics?.totalEmployees || 0} Staff
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Across {deptCosts.length} business departments
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Deductions Retained</span>
          <div className="text-3xl font-bold text-indigo-600 mt-2">
            ${(data?.metrics?.totalDeductions || 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">
            Provident Fund, Tax & Insurance
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Payroll Expenditure Trend */}
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface">Monthly Net Salary Trend</h3>
                <p className="text-xs text-slate-500">6-Month historical payroll expenditure</p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-primary border border-indigo-100 rounded-lg text-xs font-bold">
                AUDITED
              </span>
            </div>

            <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
              {monthlyTrends.map((item, idx) => {
                const heightPercent = Math.min(100, Math.round(((item.netSalary || 0) / maxNet) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${((item.netSalary || 0) / 1000).toFixed(0)}k
                    </div>
                    <div className="w-full bg-slate-100 rounded-xl h-40 flex items-end p-1 overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-indigo-400 rounded-lg transition-all duration-500 group-hover:brightness-110"
                        style={{ height: `${heightPercent || 15}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Department Cost Distribution */}
        <div className="bg-surface-container-lowest border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface">Department Cost Distribution</h3>
                <p className="text-xs text-slate-500">Compensation weighted by operational units</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {deptCosts.map((d) => {
                const totalAll = deptCosts.reduce((acc, curr) => acc + curr.totalCost, 0) || 1;
                const percent = Math.round((d.totalCost / totalAll) * 100);

                return (
                  <div key={d.department} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{d.department}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-on-surface">${d.totalCost.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
