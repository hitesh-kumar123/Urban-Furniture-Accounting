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
        <LoadingSpinner message="Generating executive reports..." />
      </div>
    );
  }

  const deptCosts = data?.departmentCosts || [];
  const monthlyTrends = data?.monthlyTrend || [];
  const maxNet = Math.max(...monthlyTrends.map((m) => m.netSalary || 0), 10000);

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Executive Analytics
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            Reports &amp; Workforce Intelligence
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            Financial auditing records, department liabilities, and exportable payroll ledgers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCSV}
          icon="file_download"
        >
          Export Ledger (CSV)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="midnight-card p-4 space-y-1">
          <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">
            Annual Net Payroll Liability
          </span>
          <div className="text-2xl font-bold text-[#F5F2EA]">
            ₹{(data?.metrics?.totalNetPayroll || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#39D98A]">Aggregated across all settle cycles</span>
        </div>

        <div className="midnight-card p-4 space-y-1">
          <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">
            Total Active Headcount
          </span>
          <div className="text-2xl font-bold text-[#F5F2EA]">
            {data?.metrics?.totalEmployees || 0} Staff
          </div>
          <span className="text-[11px] text-[#A6A3A0]">Active contractual roster</span>
        </div>

        <div className="midnight-card p-4 space-y-1">
          <span className="text-[10px] text-[#6F6C69] uppercase font-bold block">
            Total Processed Payruns
          </span>
          <div className="text-2xl font-bold text-[#FF8A65]">
            {data?.metrics?.totalPayruns || payruns.length} Batches
          </div>
          <span className="text-[11px] text-[#6F6C69]">Historical audited pay periods</span>
        </div>
      </div>

      {/* Trajectory & Department Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Trajectory */}
        <div className="lg:col-span-7 midnight-card p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Net Payout Historical Trajectory</h3>
            <span className="font-mono text-xs text-[#6F6C69]">Trailing Months</span>
          </div>

          {monthlyTrends.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-[#111114] border border-dashed border-white/10 rounded">
              <span className="material-symbols-outlined text-2xl text-[#6F6C69] mb-1">query_stats</span>
              <p className="text-xs font-semibold text-[#F5F2EA]">No Historical Records</p>
              <p className="text-[11px] text-[#6F6C69] mt-0.5">
                Trajectory will appear after your first settled payroll cycle.
              </p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {monthlyTrends.map((m, idx) => {
                const heightPercent = Math.min(100, Math.max(16, Math.round(((m.netSalary || 0) / maxNet) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 font-mono">
                    <span className="text-[9px] text-[#A6A3A0]">₹{Math.round((m.netSalary || 0) / 1000)}k</span>
                    <div className="w-full bg-[#0B0B0D] rounded h-28 flex items-end p-0.5 border border-white/5">
                      <div
                        className="w-full rounded-xs bg-[#FF6B3D] transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#6F6C69]">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Costs */}
        <div className="lg:col-span-5 midnight-card p-5 space-y-4 font-mono">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Department Cost Breakdown</h3>
          </div>

          <div className="space-y-3">
            {deptCosts.map((d) => (
              <div key={d.department} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans text-[#F5F2EA]">{d.department}</span>
                  <span className="text-[#A6A3A0] font-bold">₹{Number(d.totalCost || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-1.5 bg-[#0B0B0D] rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-[#FF6B3D]"
                    style={{ width: `${Math.min(100, Math.round((d.totalCost / 25000) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
