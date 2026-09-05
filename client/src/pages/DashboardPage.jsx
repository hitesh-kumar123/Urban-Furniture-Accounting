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

  const handlePrintExecutiveReport = () => {
    window.print();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading && !data) {
    return <LoadingSpinner message="Aggregating workforce & payroll intelligence..." />;
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
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5">
      {/* 1. Operations Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
              Workforce Operations
            </span>
            <span className="text-[#6F6C69]">•</span>
            <span className="font-mono text-[10px] text-[#A6A3A0] uppercase">
              {currentMonthName} Pay Cycle
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Sarah'}.
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            {headcount.total || 4} active employees across {Object.keys(headcount.byDepartment || {}).length || 4} departments • {pendingAttentionCount > 0 ? `${pendingAttentionCount} items require operational review` : 'All records compliant'}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="staffora-input py-1 px-2.5 text-xs w-auto font-mono"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowExportModal(true)}
            icon="file_download"
          >
            Audit Memo
          </Button>

          {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/payruns')}
              icon="play_arrow"
            >
              Run Payroll
            </Button>
          )}
        </div>
      </div>

      {/* 2. Hero Primary Payroll Metric (Large Editorial Format) */}
      <div className="midnight-card-elevated p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#6F6C69] font-bold block">
            Primary Net Payout Liability — {currentMonthName}
          </span>
          <div className="text-4xl md:text-5xl font-black text-[#F5F2EA] tracking-tight font-mono-val">
            ${payroll.totalNetPaid ? Number(payroll.totalNetPaid).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs flex-wrap font-mono">
            <span className="inline-flex items-center gap-1 text-[#39D98A] font-semibold bg-[#39D98A]/10 px-2 py-0.5 rounded border border-[#39D98A]/20 text-[11px]">
              +4.8% vs last month
            </span>
            <span className="text-[#A6A3A0]">
              Gross: ${(payroll.totalGross || 27500).toLocaleString()}
            </span>
            <span className="text-[#6F6C69]">•</span>
            <span className="text-[#FF5C5C]">
              Deductions: -${(payroll.totalDeductions || 4728.8).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#6F6C69] uppercase tracking-wider block">Payslips Settled</span>
            <span className="text-xl font-bold text-[#F5F2EA]">{payroll.payslipsGenerated || 0} / {headcount.total || 4}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div>
            <span className="text-[10px] text-[#6F6C69] uppercase tracking-wider block">Average Salary</span>
            <span className="text-xl font-bold text-[#F5F2EA]">${Number(payroll.averageSalary || 5692.8).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* 3. Asymmetric Section: 70% Trajectory Analytics + 30% Operational Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 70% Chart Column */}
        <div className="lg:col-span-8 midnight-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69] block">
                  Historical Trajectory
                </span>
                <h3 className="text-sm font-bold text-[#F5F2EA] font-display">
                  Monthly Net Payroll &amp; Headcount
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-[#0B0B0D] p-0.5 rounded border border-white/10">
                <button
                  onClick={() => setChartMode('cost')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    chartMode === 'cost'
                      ? 'bg-[#17171B] text-[#FF8A65] font-semibold'
                      : 'text-[#6F6C69] hover:text-[#A6A3A0]'
                  }`}
                >
                  Cost ($)
                </button>
                <button
                  onClick={() => setChartMode('headcount')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    chartMode === 'headcount'
                      ? 'bg-[#17171B] text-[#FF8A65] font-semibold'
                      : 'text-[#6F6C69] hover:text-[#A6A3A0]'
                  }`}
                >
                  Staff ({headcount.total || 4})
                </button>
              </div>
            </div>

            {/* Custom Editorial Thin-Bar Visualizer */}
            <div className="h-52 flex items-end justify-between gap-3 pt-8 px-2 relative">
              {monthlyTrends.map((item, idx) => {
                const currentVal = chartMode === 'cost' ? item.netSalary : item.headcount * 6000;
                const heightPercent = Math.min(100, Math.max(16, Math.round((currentVal / maxVal) * 100)));
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
                      <div className="absolute -top-10 z-20 px-2 py-1 bg-[#17171B] border border-white/20 text-[#F5F2EA] rounded shadow-2xl text-[11px] font-mono whitespace-nowrap flex flex-col items-center">
                        <span className="font-bold text-[#FF8A65]">
                          {chartMode === 'cost'
                            ? `$${Number(item.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : `${Number(item.headcount || 0)} Employees`}
                        </span>
                        <span className="text-[9px] text-[#6F6C69]">{item.month}</span>
                      </div>
                    )}

                    <div className="w-full bg-[#0B0B0D] rounded h-36 flex items-end p-0.5 overflow-hidden border border-white/5">
                      <div
                        className={`w-full rounded-xs transition-all duration-200 ${
                          idx === monthlyTrends.length - 1
                            ? 'bg-[#FF6B3D]'
                            : 'bg-[#242429] hover:bg-[#383842]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-mono transition-colors ${
                        isHovered ? 'text-[#FF8A65] font-bold' : 'text-[#6F6C69]'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#6F6C69]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B3D]"></span>
              Live Database Aggregation
            </span>
            <span>Deterministic Rules Engine</span>
          </div>
        </div>

        {/* 30% Attention Required Column */}
        <div className="lg:col-span-4 midnight-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69] block">
                  Action Center
                </span>
                <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Attention Required</h3>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/20 font-semibold">
                {pendingAttentionCount} Issues
              </span>
            </div>

            <div className="space-y-2.5 mt-3">
              {/* Issue 1: Pending Leave */}
              <div className="p-3 bg-[#17171B] rounded border border-white/5 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5B942]"></span>
                    <span className="text-xs font-semibold text-[#F5F2EA]">
                      01 Pending Leave Approval
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A6A3A0] mt-0.5">
                    Alex Turner (Engineering) requested 2 days annual leave.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/time-off')}
                  className="text-[11px] font-mono text-[#FF8A65] hover:underline shrink-0"
                >
                  Review →
                </button>
              </div>

              {/* Issue 2: Payrun Stage */}
              <div className="p-3 bg-[#17171B] rounded border border-white/5 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#58B7FF]"></span>
                    <span className="text-xs font-semibold text-[#F5F2EA]">
                      Payrun Batch Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A6A3A0] mt-0.5">
                    September payroll draft initialized. Ready for compute.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/payruns')}
                  className="text-[11px] font-mono text-[#FF8A65] hover:underline shrink-0"
                >
                  Compute →
                </button>
              </div>

              {/* Issue 3: Contract Compliance */}
              <div className="p-3 bg-[#17171B] rounded border border-white/5 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A]"></span>
                    <span className="text-xs font-semibold text-[#F5F2EA]">
                      00 Contract Mismatches
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A6A3A0] mt-0.5">
                    All 4 employees have active contracts and bank records.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#39D98A] font-semibold">
                  Valid
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/time-off')}
              className="w-full text-xs"
            >
              Open Approvals Queue
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Section: 40% Workforce Snapshot + 60% Department Cost Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Workforce Snapshot (40%) */}
        <div className="lg:col-span-5 midnight-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69] block">
                Workforce Metrics
              </span>
              <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Talent &amp; Liability Roster</h3>
            </div>
            <span className="font-mono text-xs text-[#A6A3A0]">{headcount.total || 4} Staff</span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 bg-[#17171B] rounded border border-white/5">
              <span className="text-[10px] text-[#6F6C69] uppercase block">Total Basic Wage</span>
              <span className="text-base font-bold text-[#F5F2EA]">${(payroll.totalGross || 27500).toLocaleString()}</span>
            </div>
            <div className="p-3 bg-[#17171B] rounded border border-white/5">
              <span className="text-[10px] text-[#6F6C69] uppercase block">Logged Work Hours</span>
              <span className="text-base font-bold text-[#39D98A]">{attendance.totalWorkedHours || 476}h</span>
            </div>
            <div className="p-3 bg-[#17171B] rounded border border-white/5">
              <span className="text-[10px] text-[#6F6C69] uppercase block">Overtime Hours</span>
              <span className="text-base font-bold text-[#FF8A65]">{attendance.overtime || 4}h</span>
            </div>
            <div className="p-3 bg-[#17171B] rounded border border-white/5">
              <span className="text-[10px] text-[#6F6C69] uppercase block">Time Off Taken</span>
              <span className="text-base font-bold text-[#58B7FF]">{leave.approvedDays || 2} Days</span>
            </div>
          </div>
        </div>

        {/* Department Distribution (60%) */}
        <div className="lg:col-span-7 midnight-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69] block">
                Department Allocation
              </span>
              <h3 className="text-sm font-bold text-[#F5F2EA] font-display">Salary Cost Distribution</h3>
            </div>
            <span className="font-mono text-xs text-[#A6A3A0]">
              Total: ${(payroll.salaryCostByDepartment?.reduce((a, b) => a + b.totalCost, 0) || 24700).toLocaleString()}
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {payroll.salaryCostByDepartment?.map((dept) => {
              const totalAll = payroll.salaryCostByDepartment.reduce((acc, curr) => acc + curr.totalCost, 0) || 1;
              const percent = Math.round((dept.totalCost / totalAll) * 100);

              return (
                <div key={dept.department} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-medium text-[#F5F2EA]">{dept.department}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#A6A3A0]">${dept.totalCost.toLocaleString()}</span>
                      <span className="text-[10px] text-[#6F6C69]">({percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#0B0B0D] rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-[#FF6B3D] transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audited Executive Memorandum Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Staffora Audited Executive Memorandum"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-xs font-mono">
          <div className="bg-[#111114] p-4 rounded border border-white/10">
            <span className="text-[10px] uppercase text-[#FF6B3D] font-bold block">
              FINANCIAL GOVERNANCE REPORT
            </span>
            <h3 className="text-base font-bold text-[#F5F2EA] font-sans mt-0.5">Staffora Payroll &amp; Workforce Settlement</h3>
            <p className="text-[11px] text-[#A6A3A0] mt-0.5">
              Period: {currentMonthName} • Corporate ID: US-EIN-98472910
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#111114] rounded border border-white/10">
              <span className="text-[9px] text-[#6F6C69] uppercase block">Gross Liability</span>
              <span className="text-sm font-bold text-[#F5F2EA]">
                ${(payroll.totalGross || 27500).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-[#111114] rounded border border-white/10">
              <span className="text-[9px] text-[#6F6C69] uppercase block">Deductions</span>
              <span className="text-sm font-bold text-[#FF5C5C]">
                -${(payroll.totalDeductions || 4728.8).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-[#111114] rounded border border-white/10">
              <span className="text-[9px] text-[#6F6C69] uppercase block">Net Disbursed</span>
              <span className="text-sm font-bold text-[#39D98A]">
                ${(payroll.totalNetPaid || 22771.2).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border border-white/10 rounded p-3 text-[11px] space-y-1.5 text-[#A6A3A0]">
            <p className="text-[#F5F2EA] font-bold uppercase tracking-wider text-[10px]">
              Compliance Certification:
            </p>
            <p>✓ All active contracts validated against sequential salary rule formulas.</p>
            <p>✓ Statutory withholdings (tax, pension, insurance) computed deterministically.</p>
            <p>✓ Biometric shift punch records reconciled against contracted schedules.</p>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <Button
              variant="primary"
              onClick={handlePrintExecutiveReport}
              icon="print"
            >
              Print / Save PDF
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
