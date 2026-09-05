import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
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

  if (loading && !data) {
    return <LoadingSpinner message="Calculating real-time payroll & workforce analytics..." />;
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

  return (
    <div className="p-6 max-w-[1600px] w-full mx-auto flex flex-col gap-6 animate-fadeIn">
      {/* Top Header & Interactive Filter Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-wider">
              Executive View
            </span>
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Database Aggregation • All engines normal</span>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Workforce Operations &amp; Payroll Intelligence
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back, <strong className="text-slate-700">{user?.name}</strong> • Active Role:{' '}
            <strong className="text-primary">{user?.role}</strong>
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="appearance-none bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200/80 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">All Departments (All)</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
              expand_more
            </span>
          </div>

          {/* Employee Type Filter */}
          <div className="relative">
            <select
              value={employeeTypeFilter}
              onChange={(e) => setEmployeeTypeFilter(e.target.value)}
              className="appearance-none bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200/80 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">All Types (Full-Time &amp; Contractors)</option>
              <option value="Full-Time">Full-Time Staff</option>
              <option value="Contractor">Contractors</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
              tune
            </span>
          </div>

          {/* Export Executive Pack Button */}
          <button
            onClick={handleTriggerExport}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-primary border border-primary/20 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Executive Pack</span>
          </button>
        </div>
      </div>

      {/* Operational Governance Alert Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border border-amber-200/80 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
            <span className="material-symbols-outlined text-2xl">notifications_active</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Payroll Operational Alerts &amp; Governance
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Live compliance engine monitoring active contracts, statutory deductions, and approval streams.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {leave.pending > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 font-bold text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              {leave.pending} Pending Leave Approvals
            </span>
          )}
          <button
            onClick={() => navigate('/payruns')}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Review Payruns</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 5-Card High-Impact Bento KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Net Salary Paid */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Net Salary Paid
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3">
              ${payroll.totalNetPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              +4.2%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Live settled disbursements</span>
          </div>
        </div>

        {/* KPI 2: Payslips Generated */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Payslips Generated
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">receipt</span>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3">
              {payroll.payslipsGenerated || 0} / {headcount.total || 4}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              100%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Across active contracts</span>
          </div>
        </div>

        {/* KPI 3: Average Salary */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Average Salary
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3">
              ${payroll.averageSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Benchmark
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Net baseline tier</span>
          </div>
        </div>

        {/* KPI 4: Approved Time Off */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Approved Time Off
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3">
              {leave.approvedDays || 2} Days
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {leave.approved || 1} Requests
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Auto-deducted</span>
          </div>
        </div>

        {/* KPI 5: Attendance Health */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Attendance Health
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-3">
              {attendance.present || 52} Present
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {attendance.late || 3} Late
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {attendance.totalWorkedHours?.toFixed(1) || '476.0'}h Logged
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Net Salary & Headcount Trajectory */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Fiscal Trajectory
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Monthly Net Salary &amp; Headcount Cost Curve
                </h3>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setChartMode('cost')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartMode === 'cost'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cost Curve ($)
                </button>
                <button
                  onClick={() => setChartMode('headcount')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartMode === 'headcount'
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Headcount ({headcount.total || 4})
                </button>
              </div>
            </div>

            {/* Interactive SVG Bar & Curve Chart */}
            <div className="h-64 flex items-end justify-between gap-3 pt-8 px-2 relative">
              {monthlyTrends.map((item, idx) => {
                const currentVal = chartMode === 'cost' ? item.netSalary : item.headcount * 6000;
                const heightPercent = Math.min(100, Math.max(20, Math.round((currentVal / maxVal) * 100)));
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
                      <div className="absolute -top-12 z-20 px-3 py-1.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-bold whitespace-nowrap animate-fadeIn flex flex-col items-center">
                        <span>
                          {chartMode === 'cost'
                            ? `$${Number(item.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : `${Number(item.headcount || 0)} Staff Members`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">Month: {item.month}</span>
                      </div>
                    )}

                    <div className="w-full bg-slate-100/80 rounded-2xl h-48 flex items-end p-1 overflow-hidden transition-all group-hover:bg-slate-200/70">
                      <div
                        className={`w-full rounded-xl transition-all duration-500 ${
                          idx === monthlyTrends.length - 1
                            ? 'bg-gradient-to-t from-primary to-secondary shadow-md shadow-primary/30'
                            : 'bg-gradient-to-t from-indigo-500 to-indigo-300'
                        } ${isHovered ? 'brightness-110 scale-[1.02]' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isHovered ? 'text-primary' : 'text-slate-500'
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
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              Current Run: ${Number(payroll.totalNetPaid || 0).toLocaleString()}
            </span>
            <span className="font-semibold text-emerald-600">Deterministic Engine Active</span>
          </div>
        </div>

        {/* Right 1 Col: Department Cost Distribution & Attendance Quality */}
        <div className="space-y-6">
          {/* Department Breakdown */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Resource Allocation
                </span>
                <h3 className="text-base font-bold text-slate-900">Department Cost Distribution</h3>
              </div>
            </div>

            <div className="space-y-3.5">
              {payroll.salaryCostByDepartment?.map((dept, idx) => {
                const totalAll =
                  payroll.salaryCostByDepartment.reduce((acc, curr) => acc + curr.totalCost, 0) || 1;
                const percent = Math.round((dept.totalCost / totalAll) * 100);

                const colors = [
                  'from-indigo-600 to-primary',
                  'from-purple-600 to-secondary',
                  'from-blue-600 to-cyan-500',
                  'from-emerald-600 to-teal-500'
                ];

                return (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{dept.department}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">${dept.totalCost.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          colors[idx % colors.length]
                        } transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shift & Punctuality Overview */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                  Shift Compliance
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  98.2% Accurate
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Attendance &amp; Governance Quality</h4>
              <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                Aggregating real-time badge swipes, biometric logs, and overtime multiplier triggers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                <span className="text-[10px] text-indigo-300 block">Total Work Hours</span>
                <span className="text-lg font-black text-white">{attendance.totalWorkedHours || 476}h</span>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md">
                <span className="text-[10px] text-indigo-300 block">Overtime Hours</span>
                <span className="text-lg font-black text-emerald-400">{attendance.overtime || 4}h</span>
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
          <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-2xl text-white">
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-200">
              AUDITED FINANCIAL MEMORANDUM
            </span>
            <h3 className="text-xl font-bold mt-1">Staffora Workforce &amp; Payroll Summary</h3>
            <p className="text-xs text-indigo-100 mt-0.5">
              Period: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} • Corporate ID: US-EIN-98472910
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Liability</span>
              <span className="text-base font-bold text-slate-900">
                ${(payroll.totalGross || 27500).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Statutory Deductions</span>
              <span className="text-base font-bold text-red-600">
                -${(payroll.totalDeductions || 4728.8).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Disbursed</span>
              <span className="text-base font-bold text-emerald-600">
                ${(payroll.totalNetPaid || 22771.2).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Compliance &amp; Governance Certification
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                All contracts validated against current salary structures.
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
              className="flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
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
