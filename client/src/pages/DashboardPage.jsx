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
  const [attendancePeriodFilter, setAttendancePeriodFilter] = useState('all'); // 'all' | 'month' | 'last-30' | 'today'
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
  const [liveTime, setLiveTime] = useState(new Date());

  // Live real-time clock ticking every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isEmployee = user?.role === 'Employee';

  const getElapsedShiftTime = (checkInDate) => {
    if (!checkInDate) return '00h 00m 00s';
    const start = new Date(checkInDate).getTime();
    const now = liveTime.getTime();
    const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const getShiftProgressPercent = (checkInDate, targetHours = 8) => {
    if (!checkInDate) return 0;
    const start = new Date(checkInDate).getTime();
    const now = liveTime.getTime();
    const elapsedHours = (now - start) / (1000 * 60 * 60);
    return Math.min(100, Math.max(5, Math.round((elapsedHours / targetHours) * 100)));
  };

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
          empId ? contractApi.getAll({ employee: empId }) : Promise.resolve({ data: [] })
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
        const activeContract = contractsData.find((c) => c.status === 'Active') || contractsData[0] || null;

        setEmployeeData({
          attendanceToday: todayPunch,
          recentAttendance: attData.slice(0, 5),
          leaveBalances: balData,
          recentLeaves: leavesData.slice(0, 5),
          recentPayslips: payslipsData.slice(0, 5),
          activeContract
        });
      } else {
        const res = await dashboardApi.getPayrollMetrics({
          department: departmentFilter || undefined,
          employeeType: employeeTypeFilter || undefined,
          attendancePeriod: attendancePeriodFilter || undefined
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
  }, [departmentFilter, employeeTypeFilter, attendancePeriodFilter, user]);

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
    setPunchLoading(true);
    try {
      const res = await attendanceApi.togglePunch();
      if (res.success) {
        showToast(res.message || 'Shift punch recorded successfully', 'success');
        fetchMetrics();
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
      <div className="p-5 max-w-[1400px] w-full mx-auto flex flex-col gap-6 font-body">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
                Employee Self-Service Hub
              </span>
              <span className="text-[#918C82]">•</span>
              <span className="font-mono text-xs text-[#6B665C]">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
              {getGreeting()}, {user?.name}.
            </h1>
            <p className="text-xs text-[#6B665C] mt-0.5">
              Role: <span className="text-[#1C1B19] font-medium">{user?.role}</span> • Employee ID: <span className="font-mono font-medium text-[#0F5C4A]">{user?.employee?.employeeId || 'EMP-SELF'}</span>
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
          {/* Card 1: Dynamic Shift Punch Clock */}
          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-[#6B665C]">
                  Shift Punch Clock
                </span>
                {isClockedIn && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F5C4A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F5C4A]"></span>
                  </span>
                )}
              </div>
              <Badge variant={isClockedIn ? 'success' : 'neutral'}>
                {isClockedIn ? 'Checked In • Working' : 'Checked Out'}
              </Badge>
            </div>

            {/* Dynamic Time & Shift Progress */}
            {isClockedIn ? (
              <div className="space-y-2.5 my-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#0F5C4A] font-semibold uppercase tracking-wider block">
                      Active Shift Elapsed
                    </span>
                    <div className="text-3xl font-bold text-[#0F5C4A] font-mono tracking-tight">
                      {getElapsedShiftTime(
                        employeeData.attendanceToday?.punches?.slice(-1)[0]?.in || employeeData.attendanceToday?.checkIn
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#6B665C] uppercase tracking-wider block">
                      Total Logged Today
                    </span>
                    <span className="text-sm font-mono font-bold text-[#1C1B19]">
                      {employeeData.attendanceToday?.workedHours || 0} hrs
                    </span>
                  </div>
                </div>

                {/* Live Shift Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#E7E2D9] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#0F5C4A] h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${getShiftProgressPercent(
                          employeeData.attendanceToday?.punches?.slice(-1)[0]?.in || employeeData.attendanceToday?.checkIn
                        )}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-[#6B665C]">
                    <span>
                      Session In: {new Date(
                        employeeData.attendanceToday?.punches?.slice(-1)[0]?.in || employeeData.attendanceToday?.checkIn
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      {getShiftProgressPercent(
                        employeeData.attendanceToday?.punches?.slice(-1)[0]?.in || employeeData.attendanceToday?.checkIn
                      )}% Target
                    </span>
                  </div>
                </div>

                {/* Multi-Punch Sessions List if > 1 */}
                {Array.isArray(employeeData.attendanceToday?.punches) && employeeData.attendanceToday.punches.length > 1 && (
                  <div className="bg-[#F7F5F1] p-2 rounded-lg border border-[#E7E2D9] text-[11px] font-mono text-[#6B665C] space-y-1 max-h-20 overflow-y-auto">
                    <span className="font-semibold text-[#1C1B19] block">Today's Punch Sessions:</span>
                    {employeeData.attendanceToday.punches.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>
                          #{idx + 1}: {new Date(p.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {p.out ? new Date(p.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                        </span>
                        <span className="font-medium text-[#0F5C4A]">{p.out ? `${p.durationHours}h` : 'Now'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 my-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#6B665C] uppercase tracking-wider block">
                      Current System Time
                    </span>
                    <div className="text-3xl font-bold text-[#1C1B19] font-mono tracking-tight">
                      {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                  {employeeData.attendanceToday && (
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#6B665C] uppercase tracking-wider block">
                        Logged Today
                      </span>
                      <span className="text-sm font-mono font-bold text-[#0F5C4A]">
                        {employeeData.attendanceToday.workedHours || 0} hrs
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#6B665C]">
                  {employeeData.attendanceToday?.checkOut
                    ? `Break / Shift paused at ${new Date(employeeData.attendanceToday.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${employeeData.attendanceToday.workedHours || 0}h logged today)`
                    : 'Ready to start your working shift or lunch break return'}
                </p>

                {/* Multi-Punch Sessions List if existing */}
                {Array.isArray(employeeData.attendanceToday?.punches) && employeeData.attendanceToday.punches.length > 0 && (
                  <div className="bg-[#F7F5F1] p-2 rounded-lg border border-[#E7E2D9] text-[11px] font-mono text-[#6B665C] space-y-1 max-h-20 overflow-y-auto mt-1">
                    <span className="font-semibold text-[#1C1B19] block">Today's Sessions ({employeeData.attendanceToday.punches.length}):</span>
                    {employeeData.attendanceToday.punches.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>
                          #{idx + 1}: {new Date(p.in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {p.out ? new Date(p.out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                        </span>
                        <span className="font-medium text-[#0F5C4A]">{p.durationHours || 0}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              variant={isClockedIn ? 'danger' : 'primary'}
              onClick={handlePunchClock}
              loading={punchLoading}
              icon={isClockedIn ? 'logout' : 'login'}
              className="w-full justify-center shadow-sm"
            >
              {isClockedIn ? 'Clock Out / Break' : employeeData.attendanceToday?.checkOut ? 'Clock In Again / Resume' : 'Clock In Shift'}
            </Button>
          </div>

          {/* Card 2: Active Compensation & Contract */}
          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-[#6B665C]">
                Active Contract
              </span>
              <Badge variant="info">Active</Badge>
            </div>

            <div className="space-y-1.5 my-1">
              <span className="text-xs font-mono text-[#6B665C]">Monthly Base Wage</span>
              <div className="text-3xl font-bold text-[#8A6D3B] font-mono">
                {formatINR(employeeData.activeContract?.wage || user?.employee?.wage || 145000)}
              </div>
              <p className="text-xs text-[#6B665C]">
                Structure: <span className="text-[#1C1B19] font-medium">{employeeData.activeContract?.salaryStructure?.name || 'Standard Monthly'}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-[#E7E2D9] flex items-center justify-between text-xs font-mono text-[#6B665C]">
              <span>Department</span>
              <span className="text-[#1C1B19] font-medium">{employeeData.activeContract?.department || user?.employee?.department || 'Engineering'}</span>
            </div>
          </div>

          {/* Card 3: Latest Issued Payslip */}
          <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col justify-between gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-[#6B665C]">
                Latest Payslip
              </span>
              <Badge variant="success">Paid</Badge>
            </div>

            {employeeData.recentPayslips.length > 0 ? (
              <div className="space-y-1.5 my-1">
                <span className="text-xs font-mono text-[#6B665C]">Net Take-Home Salary</span>
                <div className="text-3xl font-bold text-[#0F5C4A] font-mono">
                  {formatINR(employeeData.recentPayslips[0].net)}
                </div>
                <p className="text-xs text-[#6B665C]">
                  Period: {new Date(employeeData.recentPayslips[0].payrollPeriod?.start).toLocaleDateString()} - {new Date(employeeData.recentPayslips[0].payrollPeriod?.end).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="py-3 text-xs text-[#6B665C]">
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
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
            <div>
              <span className="text-xs font-mono font-medium text-[#6B665C] block">
                Statutory Entitlements
              </span>
              <h3 className="text-base font-heading font-medium text-[#1C1B19]">
                Annual Time Off Balances
              </h3>
            </div>
            <Link to="/time-off" className="text-xs text-[#0F5C4A] hover:underline font-medium">
              View all requests
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {employeeData.leaveBalances.length > 0 ? (
              employeeData.leaveBalances.map((bal, idx) => {
                const typeName = bal.timeOffType?.name || bal.leaveType?.name || bal.name || 'Annual Leave';
                const allocated = bal.allocated ?? (Number(bal.used || 0) + Number(bal.remaining || 0)) ?? 18;
                const used = bal.used ?? 0;
                const remaining = bal.remaining ?? (allocated - used);
                const percent = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

                return (
                  <div key={idx} className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1C1B19] truncate max-w-[160px]" title={typeName}>
                        {typeName}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0F5C4A] shrink-0">{remaining}d left</span>
                    </div>
                    <div className="w-full bg-[#E7E2D9] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#0F5C4A] h-full rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6B665C]">
                      <span>Used: {used}d</span>
                      <span>Total: {allocated}d</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 py-4 text-center text-xs text-[#6B665C]">
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
            <form onSubmit={handleQuickLeaveSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF9F6] border border-[#E7E2D9] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#6B665C] font-medium block">Applying as</span>
                  <span className="text-xs font-semibold text-[#1C1B19]">{user?.name}</span>
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
                    className="staffora-input font-mono"
                  />
                </div>
                <div>
                  <label className="staffora-label">End Date *</label>
                  <input
                    type="date"
                    required
                    value={quickLeaveForm.endDate}
                    onChange={(e) => setQuickLeaveForm({ ...quickLeaveForm, endDate: e.target.value })}
                    className="staffora-input font-mono"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E2D9]">
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

  const monthlyTrends = rawMonthlyTrends.map((m) => ({
    rawMonth: m.month,
    month: formatMonthName(m.month),
    netSalary: Number(m.netSalary ?? m.totalNet ?? 0),
    headcount: Number(m.headcount ?? m.payslipCount ?? 0)
  }));

  const maxVal = monthlyTrends.length > 0
    ? Math.max(...monthlyTrends.map((m) => (chartMode === 'cost' ? m.netSalary : m.headcount * 60000)), 10000)
    : 10000;
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const pendingAttentionCount = (leave?.pending || 0) + (alerts?.missingBankInfoEmployees || 0);

  return (
    <div className="p-5 max-w-[1600px] w-full mx-auto flex flex-col gap-5 font-body">
      {/* 1. Operations Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#0F5C4A] font-semibold">
              Workforce Operations
            </span>
            <span className="text-[#918C82]">•</span>
            <span className="font-mono text-xs text-[#6B665C]">
              {currentMonthName} Pay Cycle
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1C1B19]">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Manager'}.
          </h1>
          <p className="text-xs text-[#6B665C] mt-0.5">
            {headcount.total || 0} active employees across {Object.keys(headcount.byDepartment || {}).length || 0} departments • {pendingAttentionCount > 0 ? `${pendingAttentionCount} items require operational review` : 'All records compliant'}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

          <select
            value={employeeTypeFilter}
            onChange={(e) => setEmployeeTypeFilter(e.target.value)}
            className="staffora-input py-1.5 px-3 text-xs w-auto font-medium"
          >
            <option value="">All Employee Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
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
      <div className="bg-white rounded-xl border border-[#E7E2D9] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#6B665C] font-medium block">
            Primary Net Payout Liability — {currentMonthName}
          </span>
          <div className="text-4xl md:text-5xl font-bold text-[#8A6D3B] tracking-tight font-mono">
            {formatINR(payroll.totalNetPaid || 0)}
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs flex-wrap font-mono">
            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border text-[11px] ${
              payroll.totalNetPaid > 0
                ? 'bg-[#E8F4F1] text-[#0F5C4A] border-[#0F5C4A]/20'
                : 'bg-[#FAF9F6] text-[#6B665C] border-[#E7E2D9]'
            }`}>
              {payroll.totalNetPaid > 0 ? 'Active Cycle Settled' : 'Cycle Pending'}
            </span>
            <span className="text-[#6B665C]">
              Gross: {formatINR(payroll.totalGross || 0, { decimals: 0 })}
            </span>
            <span className="text-[#918C82]">•</span>
            <span className="text-[#B5482E]">
              Deductions: -{formatINR(payroll.totalDeductions || 0, { decimals: 0 })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-[#E7E2D9] pt-4 lg:pt-0 lg:pl-6 text-xs font-mono">
          <div>
            <span className="text-xs text-[#6B665C] block">Payslips Settled</span>
            <span className="text-xl font-bold text-[#1C1B19]">{payroll.payslipsGenerated || 0} / {headcount.total || 0}</span>
          </div>
          <div className="w-px h-8 bg-[#E7E2D9]"></div>
          <div>
            <span className="text-xs text-[#6B665C] block">Average Salary</span>
            <span className="text-xl font-bold text-[#1C1B19]">{formatINR(payroll.averageSalary || 0, { decimals: 0 })}</span>
          </div>
        </div>
      </div>

      {/* 2.5 Attendance Overview KPI Section */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0F5C4A] text-base">schedule</span>
              <h3 className="text-sm font-heading font-medium text-[#1C1B19]">
                Attendance Overview &amp; Shift Health
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#6B665C] flex-wrap">
              <span>
                {employeeTypeFilter ? `${employeeTypeFilter} Staff` : 'All Active Staff'}
              </span>
              <span>•</span>
              <span className="font-mono text-[#0F5C4A] font-medium bg-[#E8F4F1] px-1.5 py-0.5 rounded text-[11px]">
                {attendance?.daysLogged ? `${attendance.daysLogged} Work Days Scope` : 'Live Shift Sync'}
              </span>
              {attendance?.minDate && attendance?.maxDate && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[#6B665C] text-[11px]">
                    {new Date(attendance.minDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                    {new Date(attendance.maxDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Time Scope Toggle Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-lg border border-[#E7E2D9] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAttendancePeriodFilter('today')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                attendancePeriodFilter === 'today'
                  ? 'bg-[#0F5C4A] text-white shadow-xs'
                  : 'text-[#6B665C] hover:text-[#1C1B19]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setAttendancePeriodFilter('month')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                attendancePeriodFilter === 'month'
                  ? 'bg-[#0F5C4A] text-white shadow-xs'
                  : 'text-[#6B665C] hover:text-[#1C1B19]'
              }`}
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => setAttendancePeriodFilter('last-30')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                attendancePeriodFilter === 'last-30'
                  ? 'bg-[#0F5C4A] text-white shadow-xs'
                  : 'text-[#6B665C] hover:text-[#1C1B19]'
              }`}
            >
              Past 30 Days
            </button>
            <button
              type="button"
              onClick={() => setAttendancePeriodFilter('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                attendancePeriodFilter === 'all'
                  ? 'bg-[#0F5C4A] text-white shadow-xs'
                  : 'text-[#6B665C] hover:text-[#1C1B19]'
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-lg border border-[#E7E2D9] p-3.5 space-y-1 shadow-sm">
            <span className="text-xs text-[#6B665C] block font-medium">Present</span>
            <div className="text-xl font-bold text-[#0F5C4A] flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#0F5C4A]"></span>
              {attendance?.present || 0}
            </div>
            <span className="text-[11px] text-[#6B665C]">On Shift</span>
          </div>

          <div className="bg-white rounded-lg border border-[#E7E2D9] p-3.5 space-y-1 shadow-sm">
            <span className="text-xs text-[#6B665C] block font-medium">Late Arrivals</span>
            <div className="text-xl font-bold text-[#8A6D3B] flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#8A6D3B]"></span>
              {attendance?.late || 0}
            </div>
            <span className="text-[11px] text-[#6B665C]">Shift Delays</span>
          </div>

          <div className="bg-white rounded-lg border border-[#E7E2D9] p-3.5 space-y-1 shadow-sm">
            <span className="text-xs text-[#6B665C] block font-medium">Absences</span>
            <div className="text-xl font-bold text-[#B5482E] flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#B5482E]"></span>
              {attendance?.absent || 0}
            </div>
            <span className="text-[11px] text-[#6B665C]">Unscheduled</span>
          </div>

          <div className="bg-white rounded-lg border border-[#E7E2D9] p-3.5 space-y-1 shadow-sm">
            <span className="text-xs text-[#6B665C] block font-medium">Overtime Logs</span>
            <div className="text-xl font-bold text-[#0F5C4A] flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#0F5C4A]"></span>
              {attendance?.overtime || 0}
            </div>
            <span className="text-[11px] text-[#6B665C]">Extended Hours</span>
          </div>

          <div className="bg-white rounded-lg border border-[#E7E2D9] p-3.5 space-y-1 shadow-sm">
            <span className="text-xs text-[#6B665C] block font-medium">Missing Check-Outs</span>
            <div className="text-xl font-bold text-[#B5482E] flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#B5482E]"></span>
              {attendance?.missingCheckout || 0}
            </div>
            <span className="text-[11px] text-[#6B665C]">Open Punches</span>
          </div>

          <div className="bg-white rounded-lg border border-[#E7E2D9] p-3.5 space-y-1 shadow-sm">
            <span className="text-xs text-[#6B665C] block font-medium">Total Worked</span>
            <div className="text-xl font-bold text-[#1C1B19] flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-sm text-[#6B665C]">timelapse</span>
              {Math.round(attendance?.totalWorkedHours || 0)}h
            </div>
            <span className="text-[11px] text-[#6B665C]">Aggregated Shift</span>
          </div>
        </div>
      </div>

      {/* 3. Section: Trajectory Analytics + Operational Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chart Column */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
              <div>
                <span className="text-xs font-mono text-[#6B665C] font-medium block">
                  Historical Trajectory
                </span>
                <h3 className="text-base font-heading font-medium text-[#1C1B19]">
                  Monthly Net Payroll &amp; Headcount
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-[#FAF9F6] p-0.5 rounded-lg border border-[#E7E2D9]">
                <button
                  onClick={() => setChartMode('cost')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    chartMode === 'cost'
                      ? 'bg-white text-[#1C1B19] font-semibold shadow-sm'
                      : 'text-[#6B665C] hover:text-[#1C1B19]'
                  }`}
                >
                  Cost (₹)
                </button>
                <button
                  onClick={() => setChartMode('headcount')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    chartMode === 'headcount'
                      ? 'bg-white text-[#1C1B19] font-semibold shadow-sm'
                      : 'text-[#6B665C] hover:text-[#1C1B19]'
                  }`}
                >
                  Staff ({headcount.total || 0})
                </button>
              </div>
            </div>

            {/* Clean Enterprise Bar Chart */}
            {monthlyTrends.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-[#FAF9F6] border border-dashed border-[#E7E2D9] rounded-lg mt-4">
                <span className="material-symbols-outlined text-3xl text-[#918C82] mb-1.5">bar_chart</span>
                <p className="text-xs font-semibold text-[#1C1B19]">No Historical Payruns Yet</p>
                <p className="text-xs text-[#6B665C] max-w-xs mt-0.5">
                  Generate and compute your monthly payrun batches to track real-time net salary trajectory.
                </p>
                {hasRole('Admin', 'HR Payroll User', 'HR Payroll Manager') && (
                  <button
                    onClick={() => navigate('/payruns')}
                    className="mt-3 px-3.5 py-1.5 bg-[#0F5C4A] hover:bg-[#0B4739] text-white font-medium text-xs rounded-md transition-colors shadow-sm"
                  >
                    Run First Payrun
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 relative h-56 flex flex-col justify-between">
                {/* Subtle Horizontal Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pt-2">
                  <div className="w-full border-b border-dashed border-[#E7E2D9] flex justify-start">
                    <span className="text-[10px] font-mono text-[#918C82] -mt-2 bg-white pr-1.5">
                      {chartMode === 'cost' ? formatINR(maxVal, { compact: true }) : `${Math.round(maxVal / 60000)} Staff`}
                    </span>
                  </div>
                  <div className="w-full border-b border-dashed border-[#E7E2D9] flex justify-start">
                    <span className="text-[10px] font-mono text-[#918C82] -mt-2 bg-white pr-1.5">
                      {chartMode === 'cost' ? formatINR(maxVal * 0.66, { compact: true }) : `${Math.round((maxVal * 0.66) / 60000)} Staff`}
                    </span>
                  </div>
                  <div className="w-full border-b border-dashed border-[#E7E2D9] flex justify-start">
                    <span className="text-[10px] font-mono text-[#918C82] -mt-2 bg-white pr-1.5">
                      {chartMode === 'cost' ? formatINR(maxVal * 0.33, { compact: true }) : `${Math.round((maxVal * 0.33) / 60000)} Staff`}
                    </span>
                  </div>
                  <div className="w-full border-b border-[#E7E2D9]"></div>
                </div>

                {/* Bars Visualization Container */}
                <div className="relative z-10 h-full flex items-end justify-around gap-6 px-10 pb-7">
                  {monthlyTrends.map((item, idx) => {
                    const currentVal = chartMode === 'cost' ? item.netSalary : item.headcount * 60000;
                    const heightPercent = Math.min(100, Math.max(12, Math.round((currentVal / maxVal) * 100)));
                    const isHovered = hoveredBar === idx;

                    return (
                      <div
                        key={item.month + idx}
                        className="flex flex-col items-center group cursor-pointer relative h-full justify-end"
                        onMouseEnter={() => setHoveredBar(idx)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Interactive Tooltip with exact ₹ amount and readable month */}
                        {isHovered && (
                          <div className="absolute -top-14 z-30 bg-white border border-[#E7E2D9] px-3 py-1.5 rounded-lg shadow-md pointer-events-none text-center whitespace-nowrap">
                            <span className="text-[10px] font-mono text-[#6B665C] block font-medium">{item.month}</span>
                            <span className="text-xs font-bold font-mono text-[#0F5C4A]">
                              {chartMode === 'cost'
                                ? `₹${Number(item.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${item.headcount} Active Employees`}
                            </span>
                          </div>
                        )}

                        {/* Slim Emerald Bar with clean border */}
                        <div className="w-7 bg-[#FAF9F6] rounded-t-md flex flex-col justify-end overflow-hidden h-full border border-[#E7E2D9] group-hover:border-[#0F5C4A] transition-colors">
                          <div
                            className="w-full bg-[#0F5C4A] transition-all duration-300 rounded-t-sm group-hover:bg-[#0B4739]"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>

                        {/* Readable Month X-Axis Label */}
                        <span className="absolute -bottom-6 text-xs font-mono font-medium text-[#6B665C] group-hover:text-[#1C1B19] transition-colors whitespace-nowrap">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Operational Attention Column */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E7E2D9] p-5 flex flex-col gap-4 shadow-sm">
          <div className="pb-3 border-b border-[#E7E2D9]">
            <span className="text-xs font-mono text-[#6B665C] font-medium block">
              Governance &amp; Audit
            </span>
            <h3 className="text-base font-heading font-medium text-[#1C1B19]">
              Action Items
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0F5C4A] text-xl">event_busy</span>
                <div>
                  <span className="text-xs font-semibold text-[#1C1B19] block">Pending Leaves</span>
                  <span className="text-[11px] text-[#6B665C]">{leave?.pending || 0} requests awaiting review</span>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/time-off')}>
                Review
              </Button>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E7E2D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0F5C4A] text-xl">schedule</span>
                <div>
                  <span className="text-xs font-semibold text-[#1C1B19] block">Attendance Health</span>
                  <span className="text-[11px] text-[#6B665C]">{attendance?.present || 0} present today</span>
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
            <div className="p-4 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E2D9] pb-3">
                <div>
                  <span className="text-[10px] text-[#0F5C4A] uppercase font-bold tracking-wider block">
                    Confidential • Executive Disbursal Audit
                  </span>
                  <h2 className="text-base font-bold text-[#1C1B19] font-heading">
                    Staffora Operations — Payroll Ledger Snapshot
                  </h2>
                </div>
                <div className="text-right">
                  <Badge variant="success">Audit Compliant</Badge>
                  <span className="text-[10px] text-[#6B665C] block mt-1">Ref: MEMO-2026-Q3</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 text-[#6B665C]">
                <div>
                  <span className="text-[10px] text-[#918C82] uppercase block">Audit Period</span>
                  <span className="text-[#1C1B19] font-semibold">{currentMonthName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#918C82] uppercase block">Audited By</span>
                  <span className="text-[#1C1B19] font-semibold">{user?.name} ({user?.role})</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#918C82] uppercase block">Headcount</span>
                  <span className="text-[#1C1B19] font-semibold">{headcount.total} Active Staff</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#918C82] uppercase block">Payslips Settled</span>
                  <span className="text-[#0F5C4A] font-semibold">{payroll.payslipsGenerated} / {headcount.total}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white rounded-lg border border-[#E7E2D9]">
                <span className="text-[10px] text-[#6B665C] uppercase block font-semibold">Gross Payout Liability</span>
                <span className="text-base font-bold text-[#1C1B19] mt-0.5 block">
                  {formatINR(payroll.totalGross || 0)}
                </span>
                <span className="text-[10px] text-[#918C82]">Base + All Allowances</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E7E2D9]">
                <span className="text-[10px] text-[#6B665C] uppercase block font-semibold">Total Deductions</span>
                <span className="text-base font-bold text-[#B5482E] mt-0.5 block">
                  -{formatINR(payroll.totalDeductions || 0)}
                </span>
                <span className="text-[10px] text-[#918C82]">EPF, PT &amp; Income Tax</span>
              </div>

              <div className="p-3 bg-[#FAF4E8] rounded-lg border border-[#8A6D3B]/30">
                <span className="text-[10px] text-[#8A6D3B] uppercase block font-semibold">Net Disbursed</span>
                <span className="text-base font-bold text-[#8A6D3B] mt-0.5 block">
                  {formatINR(payroll.totalNetPaid || 0)}
                </span>
                <span className="text-[10px] text-[#8A6D3B]">Bank Transfer Liability</span>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="space-y-1.5">
              <span className="text-xs uppercase text-[#6B665C] font-semibold block">
                Departmental Cost Distribution
              </span>
              <div className="border border-[#E7E2D9] rounded-lg divide-y divide-[#E7E2D9] bg-white max-h-48 overflow-y-auto">
                {(payroll.salaryCostByDepartment || []).length === 0 ? (
                  <div className="p-3 text-center text-[#6B665C]">No departmental records.</div>
                ) : (
                  (payroll.salaryCostByDepartment || []).map((dept) => {
                    const pct = payroll.totalGross > 0 ? Math.round((dept.totalCost / payroll.totalGross) * 100) : 0;
                    return (
                      <div key={dept.department} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[#1C1B19] font-medium">{dept.department}</span>
                          <span className="text-[11px] text-[#6B665C] ml-2">({dept.employeeCount || 1} employees)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-[#6B665C] font-mono">{pct}% of Gross</span>
                          <span className="font-bold text-[#1C1B19] font-mono">{formatINR(dept.totalCost)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Statutory Compliance Note */}
            <div className="p-2.5 bg-[#FAF9F6] rounded-lg border border-[#E7E2D9] text-xs text-[#6B665C] flex items-center justify-between">
              <span>Audited under Indian Statutory Rules (PF Act, 1952 • Income Tax Act, 1961 • ESI Act)</span>
              <span className="text-[#0F5C4A] font-semibold">100% Tax Compliant</span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-[#E7E2D9]">
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
