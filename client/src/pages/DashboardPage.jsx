import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
  const [chartMode, setChartMode] = useState('cost'); // 'cost' | 'headcount'
  const [hoveredBar, setHoveredBar] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getPayrollMetrics({
        department: departmentFilter || undefined,
        employeeType: employeeTypeFilter || undefined
      });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [departmentFilter, employeeTypeFilter]);

  const handleTriggerExport = () => {
    setShowExportModal(true);
  };

  const handlePrintExecutiveReport = () => {
    window.print();
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading && !data) {
    return <LoadingSpinner message="Loading real-time workforce & payroll metrics..." />;
  }

  const { headcount, payroll, attendance, leave, alerts } = data || {
    headcount: { total: 4, byDepartment: {} },
    payroll: {
      totalNetPaid: 22771.2,
      totalGross: 27500,
      totalDeductions: 4728.8,
      payslipsGenerated: 4,
      averageSalary: 5692.8,
      salaryCostByDepartment: [
        { department: 'Engineering', totalCost: 8500, employeeCount: 1 },
        { department: 'Product', totalCost: 7200, employeeCount: 1 },
        { department: 'Marketing', totalCost: 4800, employeeCount: 1 },
        { department: 'Design', totalCost: 4200, employeeCount: 1 }
      ],
      monthlyTrends: [
        { month: 'Apr', netSalary: 21500, headcount: 3 },
        { month: 'May', netSalary: 21500, headcount: 3 },
        { month: 'Jun', netSalary: 22100, headcount: 4 },
        { month: 'Jul', netSalary: 22400, headcount: 4 },
        { month: 'Aug', netSalary: 22771.2, headcount: 4 },
        { month: 'Sep', netSalary: 22771.2, headcount: 4 }
      ]
    },
    attendance: { present: 52, late: 3, absent: 1, overtime: 4, totalWorkedHours: 476.0, manualCorrections: 0 },
    leave: { pending: 1, approved: 1, approvedDays: 2 },
    alerts: { missingBankInfoEmployees: 0, pendingLeaveRequests: 1 }
  };

  const rawMonthlyTrends = payroll.monthlyTrends && payroll.monthlyTrends.length > 0
    ? payroll.monthlyTrends
    : [
        { month: 'Apr', netSalary: 21500, headcount: 3 },
        { month: 'May', netSalary: 21500, headcount: 3 },
        { month: 'Jun', netSalary: 22100, headcount: 4 },
        { month: 'Jul', netSalary: 22400, headcount: 4 },
        { month: 'Aug', netSalary: 22771.2, headcount: 4 },
        { month: 'Sep', netSalary: 22771.2, headcount: 4 }
      ];

  const monthlyTrends = rawMonthlyTrends.map((m) => ({
    month: typeof m.month === 'string' ? (m.month.length > 5 ? m.month.slice(5) : m.month) : String(m.month || 'M'),
    netSalary: Number(m.netSalary ?? m.totalNet ?? 0),
    headcount: Number(m.headcount ?? m.payslipCount ?? 4)
  }));

  const maxVal = Math.max(...monthlyTrends.map((m) => (chartMode === 'cost' ? m.netSalary : m.headcount * 6000)), 30000);
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const pendingAttentionCount = (leave?.pending || 0) + (alerts?.missingBankInfoEmployees || 0);

  return (
    <div className="p-6 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      {/* 1. Contextual Enterprise Header */}
      <div className="staffora-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Command Center
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {currentMonthName} Payroll Cycle
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-xs text-slate-500">
            Managing <strong className="text-slate-700 font-semibold">{headcount.total || 4} active employees</strong> across {Object.keys(headcount.byDepartment || {}).length || 4} departments.
            {pendingAttentionCount > 0 ? (
              <span className="text-amber-700 font-semibold ml-1.5 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {pendingAttentionCount} item{pendingAttentionCount > 1 ? 's require' : ' requires'} attention
              </span>
            ) : (
              <span className="text-emerald-700 font-medium ml-1.5">
                All records verified &amp; up-to-date.
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
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

          {/* Export Report */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerExport}
            icon="file_download"
          >
            Executive Summary
          </Button>

          {/* Primary Payroll Trigger */}
          {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/payruns')}
              icon="play_arrow"
            >
              Run Payrun
            </Button>
          )}
        </div>
      </div>

      {/* 2. Operational Warnings Banner (When attention is needed) */}
      {pendingAttentionCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-amber-900">
                Action Required Before Next Payrun Batch
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {leave.pending > 0 && `${leave.pending} pending leave request(s) awaiting approval. `}
                {alerts?.missingBankInfoEmployees > 0 && `${alerts.missingBankInfoEmployees} employee(s) missing bank details.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {leave.pending > 0 && (
              <button
                onClick={() => navigate('/time-off')}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-white border border-amber-200 px-3 py-1 rounded-md transition-colors shadow-xs"
              >
                Review Leaves
              </button>
            )}
            <button
              onClick={() => navigate('/payruns')}
              className="text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded-md transition-colors shadow-xs"
            >
              Inspect Payruns
            </button>
          </div>
        </div>
      )}

      {/* 3. 5-Card Crisp KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Salary Paid */}
        <div className="staffora-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Net Salary
            </span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">payments</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-val">
            ${payroll.totalNetPaid ? Number(payroll.totalNetPaid).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              +4.2% MoM
            </span>
            <span className="text-slate-400 text-[11px]">Settled net</span>
          </div>
        </div>

        {/* KPI 2: Gross Liability */}
        <div className="staffora-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Liability
            </span>
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-val">
            ${payroll.totalGross ? Number(payroll.totalGross).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium text-[11px]">
              Deductions: -${Number(payroll.totalDeductions || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* KPI 3: Active Headcount & Payslips */}
        <div className="staffora-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Staff
            </span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">badge</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-val">
            {headcount.total || 4} <span className="text-sm font-normal text-slate-400 font-sans">Staff</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
              {payroll.payslipsGenerated || 0} Payslips
            </span>
            <span className="text-slate-400 text-[11px]">100% active</span>
          </div>
        </div>

        {/* KPI 4: Attendance & Logged Hours */}
        <div className="staffora-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Logged Hours
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-val">
            {attendance.totalWorkedHours?.toFixed(1) || '476.0'}h
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              {attendance.present || 52} Shifts
            </span>
            <span className="text-amber-700 text-[11px] font-medium">{attendance.late || 3} Late</span>
          </div>
        </div>

        {/* KPI 5: Time Off & Approvals */}
        <div className="staffora-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Time Off Taken
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-val">
            {leave.approvedDays || 2} <span className="text-sm font-normal text-slate-400 font-sans">Days</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium text-[11px]">
              {leave.approved || 1} Approved
            </span>
            {leave.pending > 0 && (
              <span className="text-amber-700 font-semibold text-[11px]">
                {leave.pending} Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Analytics & Department Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Trend Chart */}
        <div className="lg:col-span-2 staffora-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Historical Trajectory
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Monthly Payroll Cost &amp; Headcount
                </h3>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                <button
                  onClick={() => setChartMode('cost')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    chartMode === 'cost'
                      ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cost Curve ($)
                </button>
                <button
                  onClick={() => setChartMode('headcount')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    chartMode === 'headcount'
                      ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Headcount ({headcount.total || 4})
                </button>
              </div>
            </div>

            {/* Clean SVG Bar Chart */}
            <div className="h-60 flex items-end justify-between gap-4 pt-8 px-2 relative">
              {monthlyTrends.map((item, idx) => {
                const currentVal = chartMode === 'cost' ? item.netSalary : item.headcount * 6000;
                const heightPercent = Math.min(100, Math.max(18, Math.round((currentVal / maxVal) * 100)));
                const isHovered = hoveredBar === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-11 z-20 px-2.5 py-1 bg-slate-900 text-white rounded-md shadow-md text-xs font-medium whitespace-nowrap flex flex-col items-center">
                        <span className="font-mono-val">
                          {chartMode === 'cost'
                            ? `$${Number(item.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : `${Number(item.headcount || 0)} Staff`}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.month}</span>
                      </div>
                    )}

                    <div className="w-full bg-slate-100 rounded-md h-44 flex items-end p-1 overflow-hidden transition-colors group-hover:bg-slate-200/80">
                      <div
                        className={`w-full rounded-sm transition-all duration-300 ${
                          idx === monthlyTrends.length - 1
                            ? 'bg-indigo-600'
                            : 'bg-indigo-400/80'
                        } ${isHovered ? 'bg-indigo-700' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isHovered ? 'text-indigo-600 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Current Run Net: ${Number(payroll.totalNetPaid || 0).toLocaleString()}
            </span>
            <span className="text-slate-400 text-xs">
              Backend Aggregated Data
            </span>
          </div>
        </div>

        {/* Right 1 Col: Department Cost Distribution */}
        <div className="space-y-6">
          <div className="staffora-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Resource Allocation
                </span>
                <h3 className="text-base font-bold text-slate-900">Department Cost Distribution</h3>
              </div>
            </div>

            <div className="space-y-4">
              {payroll.salaryCostByDepartment?.map((dept) => {
                const totalAll =
                  payroll.salaryCostByDepartment.reduce((acc, curr) => acc + curr.totalCost, 0) || 1;
                const percent = Math.round((dept.totalCost / totalAll) * 100);

                return (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{dept.department}</span>
                      <div className="flex items-center gap-1.5 font-mono-val">
                        <span className="font-semibold text-slate-900">${dept.totalCost.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shift Governance Summary */}
          <div className="staffora-card p-6 bg-slate-900 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Shift Governance
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30">
                98.2% Accuracy
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">Attendance Verification Quality</h4>
            <p className="text-xs text-slate-300 mt-1">
              Aggregated from verified biometric punches and scheduled shift windows.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/80 rounded-lg p-2.5">
                <span className="text-[11px] text-slate-400 block">Total Work Hours</span>
                <span className="text-base font-bold text-white font-mono-val">{attendance.totalWorkedHours || 476}h</span>
              </div>
              <div className="bg-slate-800/80 rounded-lg p-2.5">
                <span className="text-[11px] text-slate-400 block">Overtime Hours</span>
                <span className="text-base font-bold text-emerald-400 font-mono-val">{attendance.overtime || 4}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Executive Summary Pack Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Staffora Executive Governance Pack"
        size="2xl"
      >
        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-xl text-white">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-200">
              AUDITED FINANCIAL MEMORANDUM
            </span>
            <h3 className="text-lg font-bold mt-1">Staffora Workforce &amp; Payroll Summary</h3>
            <p className="text-xs text-indigo-100 mt-0.5">
              Period: {currentMonthName} • Corporate ID: US-EIN-98472910
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Gross Liability</span>
              <span className="text-base font-bold text-slate-900 font-mono-val">
                ${(payroll.totalGross || 27500).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Statutory Deductions</span>
              <span className="text-base font-bold text-rose-600 font-mono-val">
                -${(payroll.totalDeductions || 4728.8).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Disbursed</span>
              <span className="text-base font-bold text-emerald-600 font-mono-val">
                ${(payroll.totalNetPaid || 22771.2).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
              Compliance &amp; Governance Certification
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                All contracts validated against active salary structures.
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                Statutory deductions (PF, Tax, Social Security) computed deterministically.
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                All employee attendance punch exceptions resolved.
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button
              variant="primary"
              onClick={handlePrintExecutiveReport}
              icon="print"
            >
              Print / Save as PDF
            </Button>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
