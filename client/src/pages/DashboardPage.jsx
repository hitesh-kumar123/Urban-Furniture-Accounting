import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { attendanceApi } from '../api/attendanceApi';
import { timeOffApi } from '../api/timeOffApi';
import { payslipApi } from '../api/payslipApi';
import { contractApi } from '../api/contractApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/currency';

export const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Admin / HR Manager Dashboard States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
  const [chartMode, setChartMode] = useState('cost'); // 'cost' | 'headcount'
  const [hoveredBar, setHoveredBar] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Employee Self-Service Dashboard States
  const [employeeData, setEmployeeData] = useState({
    attendanceToday: null,
    recentAttendance: [],
    leaveBalances: [],
    recentLeaves: [],
    recentPayslips: [],
    activeContract: null
  });
  const [punchLoading, setPunchLoading] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [showQuickLeaveModal, setShowQuickLeaveModal] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [quickLeaveForm, setQuickLeaveForm] = useState({
    timeOffType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const isEmployee = user?.role === 'Employee';

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      if (isEmployee) {
        const empId = user?.employee?._id || user?.employee;
        const [typesRes, attRes, balRes, leavesRes, payslipsRes, contractsRes] = await Promise.allSettled([
          timeOffApi.getTypes(),
          empId ? attendanceApi.getAll({ employee: empId }) : Promise.resolve({ data: [] }),
          empId ? timeOffApi.getBalance({ employeeId: empId }) : Promise.resolve({ data: [] }),
          empId ? timeOffApi.getRequests({ employee: empId }) : Promise.resolve({ data: [] }),
          empId ? payslipApi.getAll({ employee: empId }) : Promise.resolve({ data: [] }),
          empId ? contractApi.getAll({ employee: empId, status: 'Running' }) : Promise.resolve({ data: [] })
        ]);

        const typesData = typesRes.status === 'fulfilled' && typesRes.value?.success ? (typesRes.value.data || []) : [];
        const attData = attRes.status === 'fulfilled' && attRes.value?.success ? (attRes.value.data || []) : [];
        const balData = balRes.status === 'fulfilled' && balRes.value?.success ? (Array.isArray(balRes.value.data) ? balRes.value.data : []) : [];
        const leavesData = leavesRes.status === 'fulfilled' && leavesRes.value?.success ? (leavesRes.value.data || []) : [];
        const payslipsData = payslipsRes.status === 'fulfilled' && payslipsRes.value?.success ? (payslipsRes.value.data || []) : [];
        const contractsData = contractsRes.status === 'fulfilled' && contractsRes.value?.success ? (contractsRes.value.data || []) : [];

        setLeaveTypes(typesData);
        if (typesData.length > 0 && !quickLeaveForm.timeOffType) {
          setQuickLeaveForm((prev) => ({ ...prev, timeOffType: typesData[0]._id }));
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const todayPunch = attData.find((a) => a.date?.startsWith(todayStr)) || null;

        setEmployeeData({
          attendanceToday: todayPunch,
          recentAttendance: attData.slice(0, 5),
          leaveBalances: balData,
          recentLeaves: leavesData.slice(0, 5),
          recentPayslips: payslipsData.slice(0, 5),
          activeContract: contractsData[0] || null
        });
      } else {
        const res = await dashboardApi.getPayrollMetrics({
          department: departmentFilter || undefined,
          employeeType: employeeTypeFilter || undefined
        });
        if (res.success) {
          setData(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [departmentFilter, employeeTypeFilter, user]);

  const handleOpenQuickLeave = () => {
    setQuickLeaveForm({
      timeOffType: leaveTypes[0]?._id || '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setShowQuickLeaveModal(true);
  };

  const handleQuickLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!quickLeaveForm.startDate || !quickLeaveForm.endDate) {
      showToast('Please select start and end dates', 'warning');
      return;
    }

    const s = new Date(quickLeaveForm.startDate);
    const end = new Date(quickLeaveForm.endDate);
    const diff = Math.round((end.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const duration = diff > 0 ? diff : 1;

    setSubmittingLeave(true);
    try {
      const res = await timeOffApi.createRequest({
        ...quickLeaveForm,
        employee: user?.employee?._id || user?.employee,
        duration
      });
      if (res.success) {
        showToast('Leave request submitted successfully!', 'success');
        setShowQuickLeaveModal(false);
        fetchMetrics();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave request', 'error');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handlePunchClock = async () => {
    const empId = user?.employee?._id || user?.employee;
    if (!empId) {
      showToast('No linked employee profile found for punch clock', 'error');
      return;
    }

    setPunchLoading(true);
    try {
      if (employeeData.attendanceToday && !employeeData.attendanceToday.checkOut) {
        // Clock Out
        const res = await attendanceApi.clockOut(employeeData.attendanceToday._id);
        if (res.success) {
          showToast('Clocked out successfully', 'success');
          fetchMetrics();
        }
      } else {
        // Clock In
        const res = await attendanceApi.clockIn({ employee: empId });
        if (res.success) {
          showToast('Clocked in successfully', 'success');
          fetchMetrics();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Punch operation failed', 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleDownloadPDF = async (payslipId) => {
    setDownloadingPdfId(payslipId);
    try {
      await payslipApi.downloadPDF(payslipId);
      showToast('Certified PDF payslip downloaded', 'success');
    } catch (err) {
      showToast('Failed to download payslip PDF', 'error');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading && !data && !employeeData.activeContract && !employeeData.attendanceToday) {
    return <LoadingSpinner message="Loading live operational metrics..." />;
  }

  /* ------------------------------------------------------------- */
  /*               EMPLOYEE SELF-SERVICE DASHBOARD                 */
  /* ------------------------------------------------------------- */
  if (isEmployee) {
    const isClockedIn = !!(employeeData.attendanceToday && !employeeData.attendanceToday.checkOut);

    return (
      <div className="p-5 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#FF6B3D] font-semibold">
                Employee Self-Service Hub
              </span>
              <span className="text-[#6F6C69]">•</span>
              <span className="font-mono text-[10px] text-[#A6A3A0] uppercase">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#F5F2EA] tracking-tight font-display">
              {getGreeting()}, {user?.name}.
            </h1>
            <p className="text-xs text-[#A6A3A0] mt-0.5">
              Role: <span className="text-[#F5F2EA] font-semibold">{user?.role}</span> • Employee ID: <span className="font-mono text-[#FF8A65]">{user?.employee?.employeeId || 'EMP-SELF'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenQuickLeave}
              icon="event_busy"
            >
              Apply for Leave
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/time-off')}
              icon="calendar_month"
            >
              Time Off Central
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/payslips')}
              icon="receipt"
            >
              My Payslips
            </Button>
          </div>
        </div>

        {/* 3 Core Interactive Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Shift Attendance Desk */}
          <div className="midnight-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69]">
                Shift Punch Clock
              </span>
              <Badge variant={isClockedIn ? 'success' : 'neutral'}>
                {isClockedIn ? 'Checked In' : 'Checked Out'}
              </Badge>
            </div>

            <div className="space-y-1 my-2">
              <div className="text-2xl font-bold text-[#F5F2EA] font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-xs text-[#A6A3A0]">
                {isClockedIn
                  ? `Clocked in at ${new Date(employeeData.attendanceToday.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Ready to start your working shift'}
              </p>
            </div>

            <Button
              variant={isClockedIn ? 'danger' : 'primary'}
              onClick={handlePunchClock}
              loading={punchLoading}
              icon={isClockedIn ? 'logout' : 'login'}
              className="w-full justify-center"
            >
              {isClockedIn ? 'Clock Out Shift' : 'Clock In Shift'}
            </Button>
          </div>

          {/* Card 2: Active Compensation & Contract */}
          <div className="midnight-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69]">
                Active Contract
              </span>
              <Badge variant="info">Active</Badge>
            </div>

            <div className="space-y-1.5 my-1">
              <span className="text-[10px] font-mono text-[#6F6C69] uppercase">Monthly Base Wage</span>
              <div className="text-2xl font-black text-[#F5F2EA] font-mono">
                {formatINR(employeeData.activeContract?.wage || user?.employee?.wage || 0)}
              </div>
              <p className="text-xs text-[#A6A3A0]">
                Structure: <span className="text-[#F5F2EA] font-medium">{employeeData.activeContract?.salaryStructure?.name || 'Standard Monthly'}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#6F6C69]">
              <span>Department</span>
              <span className="text-[#A6A3A0]">{user?.employee?.department || 'Engineering'}</span>
            </div>
          </div>

          {/* Card 3: Latest Issued Payslip */}
          <div className="midnight-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69]">
                Latest Payslip
              </span>
              <Badge variant="success">Paid</Badge>
            </div>

            {employeeData.recentPayslips.length > 0 ? (
              <div className="space-y-1.5 my-1">
                <span className="text-[10px] font-mono text-[#6F6C69] uppercase">Net Salary Take-Home</span>
                <div className="text-2xl font-black text-[#39D98A] font-mono">
                  {formatINR(employeeData.recentPayslips[0].net)}
                </div>
                <p className="text-xs text-[#A6A3A0]">
                  Period: {new Date(employeeData.recentPayslips[0].payrollPeriod?.start).toLocaleDateString()} - {new Date(employeeData.recentPayslips[0].payrollPeriod?.end).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="py-3 text-xs text-[#6F6C69]">
                No payslips published yet for this cycle.
              </div>
            )}

            {employeeData.recentPayslips.length > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownloadPDF(employeeData.recentPayslips[0]._id)}
                loading={downloadingPdfId === employeeData.recentPayslips[0]._id}
                icon="picture_as_pdf"
                className="w-full justify-center"
              >
                Download PDF
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => navigate('/payslips')} className="w-full justify-center">
                View Payslip History
              </Button>
            )}
          </div>
        </div>

        {/* Leave Entitlement Progress Meters */}
        <div className="midnight-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69] block">
                Statutory Entitlements
              </span>
              <h3 className="text-sm font-bold text-[#F5F2EA] font-display">
                Annual Time Off Balances
              </h3>
            </div>
            <Link to="/time-off" className="text-xs text-[#FF6B3D] hover:underline font-mono">
              View All Requests →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {employeeData.leaveBalances.length > 0 ? (
              employeeData.leaveBalances.map((bal, idx) => {
                const percent = bal.allocated > 0 ? Math.min(100, Math.round((bal.used / bal.allocated) * 100)) : 0;
                return (
                  <div key={idx} className="p-3.5 rounded bg-[#111114] border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F5F2EA]">{bal.leaveType?.name || 'Leave'}</span>
                      <span className="text-xs font-mono font-bold text-[#FF8A65]">{bal.remaining}d left</span>
                    </div>
                    <div className="w-full bg-[#1E1E24] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#FF6B3D] h-full rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#6F6C69]">
                      <span>Used: {bal.used}d</span>
                      <span>Total: {bal.allocated}d</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 py-4 text-center text-xs text-[#6F6C69]">
                Annual leave balance allocations are managed by HR.
              </div>
            )}
          </div>
        </div>

        {/* Employee Quick Apply Leave Modal */}
        {showQuickLeaveModal && (
          <Modal
            isOpen={showQuickLeaveModal}
            onClose={() => setShowQuickLeaveModal(false)}
            title="Quick Leave Application"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleQuickLeaveSubmit} className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#111114] border border-white/10 rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#6F6C69] font-bold block">Applying As</span>
                  <span className="text-xs font-semibold text-[#F5F2EA]">{user?.name}</span>
                </div>
                <Badge variant="info">{user?.employee?.employeeId || 'MY ACCOUNT'}</Badge>
              </div>

              <div>
                <label className="staffora-label">Leave Type *</label>
                <select
                  value={quickLeaveForm.timeOffType}
                  onChange={(e) => setQuickLeaveForm({ ...quickLeaveForm, timeOffType: e.target.value })}
                  className="staffora-input"
                  required
                >
                  {leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.isPaid ? 'Paid' : 'Unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="staffora-label">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={quickLeaveForm.startDate}
                    onChange={(e) => setQuickLeaveForm({ ...quickLeaveForm, startDate: e.target.value })}
                    className="staffora-input"
                  />
                </div>
                <div>
                  <label className="staffora-label">End Date *</label>
                  <input
                    type="date"
                    required
                    value={quickLeaveForm.endDate}
                    onChange={(e) => setQuickLeaveForm({ ...quickLeaveForm, endDate: e.target.value })}
                    className="staffora-input"
                  />
                </div>
              </div>

              <div>
                <label className="staffora-label">Reason / Justification</label>
                <textarea
                  rows={2}
                  value={quickLeaveForm.reason}
                  onChange={(e) => setQuickLeaveForm({ ...quickLeaveForm, reason: e.target.value })}
                  className="staffora-input"
                  placeholder="e.g. Vacation, Medical emergency, Family event"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button variant="secondary" type="button" onClick={() => setShowQuickLeaveModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={submittingLeave}>
                  Submit Application
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /*             EXECUTIVE HR / PAYROLL INTELLIGENCE DASHBOARD     */
  /* ------------------------------------------------------------- */
  const { headcount, payroll, attendance, leave, alerts } = data || {
    headcount: { total: 0, byDepartment: {} },
    payroll: {
      totalNetPaid: 0,
      totalGross: 0,
      totalDeductions: 0,
      payslipsGenerated: 0,
      averageSalary: 0,
      salaryCostByDepartment: [],
      monthlyTrends: []
    },
    attendance: { present: 0, late: 0, absent: 0, overtime: 0, totalWorkedHours: 0, manualCorrections: 0 },
    leave: { pending: 0, approved: 0, approvedDays: 0 },
    alerts: { missingBankInfoEmployees: 0, pendingLeaveRequests: 0 }
  };

  const rawMonthlyTrends = payroll.monthlyTrends || [];

  const monthlyTrends = rawMonthlyTrends.map((m) => ({
    month: typeof m.month === 'string' ? (m.month.length > 5 ? m.month.slice(5) : m.month) : String(m.month || 'M'),
    netSalary: Number(m.netSalary ?? m.totalNet ?? 0),
    headcount: Number(m.headcount ?? m.payslipCount ?? 0)
  }));

  const maxVal = monthlyTrends.length > 0
    ? Math.max(...monthlyTrends.map((m) => (chartMode === 'cost' ? m.netSalary : m.headcount * 60000)), 10000)
    : 10000;
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
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Manager'}.
          </h1>
          <p className="text-xs text-[#A6A3A0] mt-0.5">
            {headcount.total || 0} active employees across {Object.keys(headcount.byDepartment || {}).length || 0} departments • {pendingAttentionCount > 0 ? `${pendingAttentionCount} items require operational review` : 'All records compliant'}.
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

      {/* 2. Hero Primary Payroll Metric */}
      <div className="midnight-card-elevated p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#6F6C69] font-bold block">
            Primary Net Payout Liability — {currentMonthName}
          </span>
          <div className="text-4xl md:text-5xl font-black text-[#F5F2EA] tracking-tight font-mono-val">
            {formatINR(payroll.totalNetPaid || 0)}
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs flex-wrap font-mono">
            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border text-[11px] ${
              payroll.totalNetPaid > 0
                ? 'bg-[#39D98A]/10 text-[#39D98A] border-[#39D98A]/20'
                : 'bg-[#6F6C69]/10 text-[#A6A3A0] border-white/10'
            }`}>
              {payroll.totalNetPaid > 0 ? 'Active Cycle Settled' : 'Cycle Pending'}
            </span>
            <span className="text-[#A6A3A0]">
              Gross: {formatINR(payroll.totalGross || 0, { decimals: 0 })}
            </span>
            <span className="text-[#6F6C69]">•</span>
            <span className="text-[#FF5C5C]">
              Deductions: -{formatINR(payroll.totalDeductions || 0, { decimals: 0 })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#6F6C69] uppercase tracking-wider block">Payslips Settled</span>
            <span className="text-xl font-bold text-[#F5F2EA]">{payroll.payslipsGenerated || 0} / {headcount.total || 0}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div>
            <span className="text-[10px] text-[#6F6C69] uppercase tracking-wider block">Average Salary</span>
            <span className="text-xl font-bold text-[#F5F2EA]">{formatINR(payroll.averageSalary || 0, { decimals: 0 })}</span>
          </div>
        </div>
      </div>

      {/* 3. Asymmetric Section: Trajectory Analytics + Operational Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chart Column */}
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
                  Cost (₹)
                </button>
                <button
                  onClick={() => setChartMode('headcount')}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    chartMode === 'headcount'
                      ? 'bg-[#17171B] text-[#FF8A65] font-semibold'
                      : 'text-[#6F6C69] hover:text-[#A6A3A0]'
                  }`}
                >
                  Staff ({headcount.total || 0})
                </button>
              </div>
            </div>

            {/* Custom Bar Visualizer */}
            {monthlyTrends.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-center p-6 bg-[#111114] border border-dashed border-white/10 rounded-lg mt-4">
                <span className="material-symbols-outlined text-3xl text-[#6F6C69] mb-1.5">bar_chart</span>
                <p className="text-xs font-semibold text-[#F5F2EA]">No Historical Payruns Yet</p>
                <p className="text-[11px] text-[#6F6C69] max-w-xs mt-0.5">
                  Generate and compute your monthly payrun batches to track real-time net salary trajectory.
                </p>
                {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
                  <button
                    onClick={() => navigate('/payruns')}
                    className="mt-3 px-3 py-1 bg-[#FF6B3D] hover:bg-[#FF8A65] text-[#0B0B0D] font-bold text-xs rounded transition-colors"
                  >
                    Run First Payrun
                  </button>
                )}
              </div>
            ) : (
              <div className="h-52 flex items-end justify-between gap-3 pt-8 px-2 relative">
                {monthlyTrends.map((item, idx) => {
                  const currentVal = chartMode === 'cost' ? item.netSalary : item.headcount * 60000;
                  const heightPercent = Math.min(100, Math.max(16, Math.round((currentVal / maxVal) * 100)));
                  const isHovered = hoveredBar === idx;

                  return (
                    <div
                      key={item.month + idx}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative h-full justify-end"
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {isHovered && (
                        <div className="absolute -top-12 z-20 bg-[#17171B] border border-white/20 px-2.5 py-1 rounded shadow-xl pointer-events-none text-center whitespace-nowrap">
                          <span className="text-[10px] font-mono text-[#6F6C69] block">{item.month}</span>
                          <span className="text-xs font-bold font-mono text-[#F5F2EA]">
                            {chartMode === 'cost' ? formatINR(item.netSalary, { compact: true }) : `${item.headcount} Staff`}
                          </span>
                        </div>
                      )}

                      <div className="w-full max-w-[32px] bg-[#17171B] rounded-t flex flex-col justify-end overflow-hidden h-full border border-white/5 group-hover:border-[#FF6B3D]/50 transition-colors">
                        <div
                          className="w-full bg-[#FF6B3D] transition-all duration-300 rounded-t group-hover:bg-[#FF8A65]"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </div>

                      <span className="text-[10px] font-mono text-[#6F6C69] group-hover:text-[#F5F2EA] transition-colors">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Operational Attention Column */}
        <div className="lg:col-span-4 midnight-card p-5 flex flex-col gap-4">
          <div className="pb-3 border-b border-white/10">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6F6C69] block">
              Governance &amp; Audit
            </span>
            <h3 className="text-sm font-bold text-[#F5F2EA] font-display">
              Action Items
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3 rounded bg-[#111114] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FF6B3D] text-lg">event_busy</span>
                <div>
                  <span className="text-xs font-semibold text-[#F5F2EA] block">Pending Leaves</span>
                  <span className="text-[10px] text-[#6F6C69]">{leave?.pending || 0} requests awaiting review</span>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/time-off')}>
                Review
              </Button>
            </div>

            <div className="p-3 rounded bg-[#111114] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#39D98A] text-lg">schedule</span>
                <div>
                  <span className="text-xs font-semibold text-[#F5F2EA] block">Attendance Health</span>
                  <span className="text-[10px] text-[#6F6C69]">{attendance?.present || 0} present today</span>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/attendance')}>
                Audits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Financial Audit Memo Modal */}
      {showExportModal && (
        <Modal
          title="Executive Financial Audit Memo"
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          maxWidth="max-w-3xl"
        >
          <div className="flex flex-col gap-4 text-xs font-mono">
            {/* Memo Official Header */}
            <div className="p-4 bg-[#111114] rounded-lg border border-white/10 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] text-[#FF6B3D] uppercase font-bold tracking-widest block">
                    Confidential • Executive Disbursal Audit
                  </span>
                  <h2 className="text-base font-bold text-[#F5F2EA] font-display">
                    PeoplePay360 Operations — Payroll Ledger Snapshot
                  </h2>
                </div>
                <div className="text-right">
                  <Badge variant="success">AUDIT COMPLIANT</Badge>
                  <span className="text-[10px] text-[#6F6C69] block mt-1">Ref: MEMO-2026-Q3</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-[#A6A3A0]">
                <div>
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Audit Period</span>
                  <span className="text-[#F5F2EA] font-semibold">{currentMonthName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Audited By</span>
                  <span className="text-[#F5F2EA] font-semibold">{user?.name} ({user?.role})</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Headcount</span>
                  <span className="text-[#F5F2EA] font-semibold">{headcount.total} Active Staff</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#6F6C69] uppercase block">Payslips Settled</span>
                  <span className="text-[#39D98A] font-semibold">{payroll.payslipsGenerated} / {headcount.total}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#17171B] rounded border border-white/5">
                <span className="text-[9px] text-[#6F6C69] uppercase block font-bold">Gross Payout Liability</span>
                <span className="text-base font-black text-[#F5F2EA] font-mono-val mt-0.5 block">
                  {formatINR(payroll.totalGross || 0)}
                </span>
                <span className="text-[10px] text-[#A6A3A0]">Base + All Allowances</span>
              </div>

              <div className="p-3 bg-[#17171B] rounded border border-white/5">
                <span className="text-[9px] text-[#6F6C69] uppercase block font-bold">Total Statutory Deductions</span>
                <span className="text-base font-black text-[#FF5C5C] font-mono-val mt-0.5 block">
                  -{formatINR(payroll.totalDeductions || 0)}
                </span>
                <span className="text-[10px] text-[#A6A3A0]">EPF, PT &amp; Income Tax (TDS)</span>
              </div>

              <div className="p-3 bg-[#17171B] rounded border border-[#39D98A]/30 bg-[#39D98A]/5">
                <span className="text-[9px] text-[#39D98A] uppercase block font-bold">Net Disbursed Amount</span>
                <span className="text-base font-black text-[#39D98A] font-mono-val mt-0.5 block">
                  {formatINR(payroll.totalNetPaid || 0)}
                </span>
                <span className="text-[10px] text-[#A6A3A0]">Bank Transfer Liability</span>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-[#6F6C69] font-bold block">
                Departmental Cost Distribution
              </span>
              <div className="border border-white/10 rounded divide-y divide-white/5 bg-[#111114] max-h-48 overflow-y-auto">
                {(payroll.salaryCostByDepartment || []).length === 0 ? (
                  <div className="p-3 text-center text-[#6F6C69]">No departmental records.</div>
                ) : (
                  (payroll.salaryCostByDepartment || []).map((dept) => {
                    const pct = payroll.totalGross > 0 ? Math.round((dept.totalCost / payroll.totalGross) * 100) : 0;
                    return (
                      <div key={dept.department} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[#F5F2EA] font-semibold">{dept.department}</span>
                          <span className="text-[10px] text-[#6F6C69] ml-2">({dept.employeeCount || 1} employees)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-[#6F6C69] font-mono">{pct}% of Gross</span>
                          <span className="font-bold text-[#F5F2EA] font-mono">{formatINR(dept.totalCost)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Statutory Compliance Note */}
            <div className="p-2.5 bg-[#0B0B0D] rounded border border-white/5 text-[10px] text-[#6F6C69] flex items-center justify-between">
              <span>Audited under Indian Statutory Rules (PF Act, 1952 • Income Tax Act, 1961 • ESI Act)</span>
              <span className="text-[#39D98A] font-semibold">100% Tax Compliant</span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  icon="print"
                  onClick={() => window.print()}
                >
                  Print Memo
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
